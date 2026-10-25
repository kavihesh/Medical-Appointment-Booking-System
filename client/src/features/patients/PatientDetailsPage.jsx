import { localToday } from '@mab/shared';
import { Link, useNavigate, useParams } from 'react-router';
import { Avatar } from '../../components/Avatar.jsx';
import { ConfirmDialog } from '../../components/ConfirmDialog.jsx';
import { Icon } from '../../components/Icon.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { ErrorMessage, Loading } from '../../components/States.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useDeleteConfirmation } from '../../hooks/useDeleteConfirmation.js';
import { doctorName, formatAge, formatDate, formatShortDate, formatTime, plural, toDateInput } from '../../lib/format.js';
import { PATIENT_DELETE_MESSAGE } from './patientText.js';

const CRUMBS = [{ label: 'Patients', to: '/patients' }];

export function PatientDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: patient, error, reload } = useApi(`/patients/${id}`);
  const { requestDelete, dialogProps } = useDeleteConfirmation({
    describe: (p) => ({
      path: `/patients/${p._id}`,
      name: p.fullName,
      message: PATIENT_DELETE_MESSAGE,
      blockedReason:
        p.appointments.length > 0
          ? `${p.fullName} has ${plural(p.appointments.length, 'appointment')} on record. Delete ${p.appointments.length === 1 ? 'it' : 'them'} first, then delete the patient.`
          : undefined,
    }),
    onDeleted: () => navigate('/patients'),
  });

  if (error) return <ErrorMessage error={error} onRetry={reload} />;
  if (!patient) return <Loading />;

  const today = localToday();
  const upcoming = patient.appointments.filter((a) => a.status === 'Scheduled' && toDateInput(a.date) >= today);
  const bookTo = `/appointments/new?patient=${patient._id}`;

  return (
    <>
      <PageHeader title={patient.fullName} subtitle={`${patient.gender}, ${formatAge(patient.dateOfBirth)}`} crumbs={CRUMBS}>
        <button type="button" className="btn btn-ghost btn-ghost-danger" onClick={() => requestDelete(patient)}>
          <Icon name="trash" size={16} />
          Delete
        </button>
        <Link to={`/patients/${patient._id}/edit`} className="btn btn-secondary">
          <Icon name="edit" size={16} />
          Edit
        </Link>
        <Link to={bookTo} className="btn btn-primary">
          <Icon name="plus" size={16} />
          Book appointment
        </Link>
      </PageHeader>

      <div className="detail-grid">
        <section className="panel" aria-labelledby="profile-heading">
          <div className="profile-head">
            <Avatar name={patient.fullName} size="lg" />
            <div>
              <h2 id="profile-heading">Profile</h2>
              <p className="muted">Registered {formatShortDate(patient.createdAt)}</p>
            </div>
          </div>
          <dl className="kv">
            <div>
              <dt>NIC</dt>
              <dd className="num">{patient.nic}</dd>
            </div>
            <div>
              <dt>Date of birth</dt>
              <dd className="num">{formatShortDate(patient.dateOfBirth)}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd className="num">
                <a href={`tel:${patient.phone}`}>{patient.phone}</a>
              </dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{patient.email ? <a href={`mailto:${patient.email}`}>{patient.email}</a> : '-'}</dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd>{patient.address || '-'}</dd>
            </div>
            <div>
              <dt>Blood group</dt>
              <dd>{patient.bloodGroup || 'Not recorded'}</dd>
            </div>
            <div>
              <dt>Allergies</dt>
              <dd>{patient.allergies || 'None recorded'}</dd>
            </div>
          </dl>
        </section>

        <section className="panel" aria-labelledby="history-heading">
          <div className="panel-head">
            <div>
              <h2 id="history-heading">Appointments</h2>
              <p className="muted">
                {plural(upcoming.length, 'upcoming visit')}, {plural(patient.appointments.length, 'visit')} in total
              </p>
            </div>
          </div>
          {patient.appointments.length === 0 ? (
            <div className="empty-inline">
              <p>No appointments yet.</p>
              <Link to={bookTo} className="btn btn-secondary btn-sm">
                Book the first appointment
              </Link>
            </div>
          ) : (
            <ul className="item-list">
              {patient.appointments.map((a) => (
                <li key={a._id} className="item">
                  <div className="item-main">
                    <Link to={`/doctors/${a.doctor._id}`} className="row-link">
                      {doctorName(a.doctor)}
                    </Link>
                    <div className="subline">
                      {formatDate(a.date)} at {formatTime(a.time)} · {a.reason}
                    </div>
                  </div>
                  <StatusBadge status={a.status} />
                  <Link to={`/appointments/${a._id}/edit`} className="icon-button" aria-label={`Edit appointment with ${doctorName(a.doctor)}`}>
                    <Icon name="edit" size={16} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <ConfirmDialog {...dialogProps} />
    </>
  );
}
