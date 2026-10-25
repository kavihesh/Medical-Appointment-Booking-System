import { slotTimes } from '@mab/shared';
import { Link, useNavigate, useParams } from 'react-router';
import { Avatar } from '../../components/Avatar.jsx';
import { ConfirmDialog } from '../../components/ConfirmDialog.jsx';
import { Icon } from '../../components/Icon.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { ErrorMessage, Loading } from '../../components/States.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useDeleteConfirmation } from '../../hooks/useDeleteConfirmation.js';
import { doctorName, formatDate, formatDays, formatFee, formatHours, formatTime, plural } from '../../lib/format.js';
import { DOCTOR_DELETE_MESSAGE } from './doctorText.js';

const CRUMBS = [{ label: 'Doctors', to: '/doctors' }];

export function DoctorDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: doctor, error, reload } = useApi(`/doctors/${id}`);
  const { requestDelete, dialogProps } = useDeleteConfirmation({
    describe: (d) => ({
      path: `/doctors/${d._id}`,
      name: doctorName(d),
      message: DOCTOR_DELETE_MESSAGE,
      blockedReason:
        d.upcomingCount > 0
          ? `${doctorName(d)} has ${plural(d.upcomingCount, 'upcoming appointment')}. Cancel or delete them first, then delete the doctor.`
          : undefined,
    }),
    onDeleted: () => navigate('/doctors'),
  });

  if (error) return <ErrorMessage error={error} onRetry={reload} />;
  if (!doctor) return <Loading />;

  const perDay = slotTimes(doctor).length;
  const canBook = doctor.status === 'Available';

  return (
    <>
      <PageHeader title={doctorName(doctor)} subtitle={`${doctor.specialty}${doctor.room ? `, ${doctor.room}` : ''}`} crumbs={CRUMBS}>
        <button type="button" className="btn btn-ghost btn-ghost-danger" onClick={() => requestDelete(doctor)}>
          <Icon name="trash" size={16} />
          Delete
        </button>
        <Link to={`/doctors/${doctor._id}/edit`} className="btn btn-secondary">
          <Icon name="edit" size={16} />
          Edit
        </Link>
        {canBook && (
          <Link to={`/appointments/new?doctor=${doctor._id}`} className="btn btn-primary">
            <Icon name="plus" size={16} />
            Book with this doctor
          </Link>
        )}
      </PageHeader>

      <div className="detail-grid">
        <section className="panel" aria-labelledby="profile-heading">
          <div className="profile-head">
            <Avatar name={doctor.fullName} size="lg" />
            <div>
              <h2 id="profile-heading">Profile</h2>
              <StatusBadge status={doctor.status} />
            </div>
          </div>
          <dl className="kv">
            <div>
              <dt>SLMC reg. no.</dt>
              <dd className="num">{doctor.registrationNo}</dd>
            </div>
            <div>
              <dt>Working days</dt>
              <dd>{formatDays(doctor.availableDays)}</dd>
            </div>
            <div>
              <dt>Hours</dt>
              <dd className="num">{formatHours(doctor.startTime, doctor.endTime)}</dd>
            </div>
            <div>
              <dt>Appointments</dt>
              <dd>
                {doctor.slotMinutes} minutes each, {perDay} a day
              </dd>
            </div>
            <div>
              <dt>Consultation fee</dt>
              <dd className="num">{formatFee(doctor.consultationFee)}</dd>
            </div>
            <div>
              <dt>Room</dt>
              <dd>{doctor.room || '-'}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd className="num">
                <a href={`tel:${doctor.phone}`}>{doctor.phone}</a>
              </dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${doctor.email}`}>{doctor.email}</a>
              </dd>
            </div>
          </dl>
          {!canBook && <p className="notice">This doctor is on leave. Set the status to Available to take bookings.</p>}
        </section>

        <section className="panel" aria-labelledby="upcoming-heading">
          <div className="panel-head">
            <div>
              <h2 id="upcoming-heading">Upcoming appointments</h2>
              <p className="muted">{plural(doctor.upcomingCount, 'patient')} booked</p>
            </div>
          </div>
          {doctor.upcoming.length === 0 ? (
            <div className="empty-inline">
              <p>No upcoming appointments.</p>
              {canBook && (
                <Link to={`/appointments/new?doctor=${doctor._id}`} className="btn btn-secondary btn-sm">
                  Book an appointment
                </Link>
              )}
            </div>
          ) : (
            <ul className="item-list">
              {doctor.upcoming.map((a) => (
                <li key={a._id} className="item">
                  <Avatar name={a.patient.fullName} />
                  <div className="item-main">
                    <Link to={`/patients/${a.patient._id}`} className="row-link">
                      {a.patient.fullName}
                    </Link>
                    <div className="subline">
                      {formatDate(a.date)} at {formatTime(a.time)} · {a.reason}
                    </div>
                  </div>
                  <Link to={`/appointments/${a._id}/edit`} className="icon-button" aria-label={`Edit appointment of ${a.patient.fullName}`}>
                    <Icon name="edit" size={16} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {doctor.upcomingCount > doctor.upcoming.length && (
            <Link to={`/appointments?doctor=${doctor._id}&when=upcoming`} className="btn btn-secondary btn-sm btn-block">
              View all {doctor.upcomingCount} appointments
            </Link>
          )}
        </section>
      </div>

      <ConfirmDialog {...dialogProps} />
    </>
  );
}
