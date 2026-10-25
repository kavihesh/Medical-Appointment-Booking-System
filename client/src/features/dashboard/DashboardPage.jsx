import { dayOfWeek, localToday } from '@mab/shared';
import { Link } from 'react-router';
import { Avatar } from '../../components/Avatar.jsx';
import { Icon } from '../../components/Icon.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { ErrorMessage, Loading } from '../../components/States.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { OPTIONS_PAGE_SIZE } from '../../config.js';
import { useApi } from '../../hooks/useApi.js';
import { doctorName, formatDate, formatHours, formatTime } from '../../lib/format.js';

const COMING_UP_COUNT = 5;

export function DashboardPage() {
  const todays = useApi(`/appointments?when=today&sort=date&limit=${OPTIONS_PAGE_SIZE}`);
  const upcoming = useApi(`/appointments?when=upcoming&status=Scheduled&sort=date&limit=${COMING_UP_COUNT}`);
  const doctors = useApi(`/doctors?sort=fullName&limit=${OPTIONS_PAGE_SIZE}`);
  const patients = useApi('/patients?limit=1');
  const requests = [todays, upcoming, doctors, patients];

  const error = requests.find((r) => r.error)?.error;
  const isReady = requests.every((r) => r.data);
  const today = localToday();
  const todayName = dayOfWeek(today);
  const onDuty = (doctors.data?.items ?? []).filter((d) => d.status === 'Available' && d.availableDays.includes(todayName));
  const scheduledToday = (todays.data?.items ?? []).filter((a) => a.status === 'Scheduled').length;

  return (
    <>
      <PageHeader title="Overview" subtitle={`${formatDate(today)}. Today's clinic at a glance.`}>
        <Link to="/appointments/new" className="btn btn-primary">
          <Icon name="plus" size={16} />
          Book appointment
        </Link>
      </PageHeader>

      {error && <ErrorMessage error={error} onRetry={() => requests.forEach((r) => r.reload())} />}
      {!error && !isReady && <Loading />}
      {!error && isReady && (
        <>
          <dl className="panel kpis">
            <Kpi label="Still to see today" value={scheduledToday} to="/appointments?when=today&status=Scheduled" />
            <Kpi label="Upcoming bookings" value={upcoming.data.total} to="/appointments?when=upcoming&status=Scheduled" />
            <Kpi label="Doctors on duty today" value={`${onDuty.length} of ${doctors.data.total}`} to="/doctors" />
            <Kpi label="Registered patients" value={patients.data.total} to="/patients" />
          </dl>

          <GettingStarted
            hasDoctors={doctors.data.total > 0}
            hasPatients={patients.data.total > 0}
            hasAppointments={upcoming.data.total > 0 || todays.data.total > 0}
          />

          <div className="overview-grid">
            <section className="panel" aria-labelledby="today-heading">
              <div className="panel-head">
                <div>
                  <h2 id="today-heading">Today</h2>
                  <p className="muted">Appointments for {todayName}, in time order.</p>
                </div>
              </div>
              {todays.data.items.length === 0 ? (
                <p className="empty-inline">No appointments today.</p>
              ) : (
                <Agenda appointments={todays.data.items} showStatus />
              )}
            </section>

            <section className="panel" aria-labelledby="duty-heading">
              <div className="panel-head">
                <div>
                  <h2 id="duty-heading">Doctors on duty</h2>
                  <p className="muted">Available doctors who work on {todayName}s.</p>
                </div>
              </div>
              {onDuty.length === 0 ? (
                <p className="empty-inline">No doctors work on {todayName}s.</p>
              ) : (
                <ul className="item-list">
                  {onDuty.map((d) => (
                    <li key={d._id} className="item">
                      <Avatar name={d.fullName} />
                      <div className="item-main">
                        <Link to={`/doctors/${d._id}`} className="row-link">
                          {doctorName(d)}
                        </Link>
                        <div className="subline">
                          {d.specialty}
                          {d.room && ` · ${d.room}`}
                        </div>
                      </div>
                      <span className="num subline">{formatHours(d.startTime, d.endTime)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="panel overview-week" aria-labelledby="upcoming-heading">
              <div className="panel-head">
                <div>
                  <h2 id="upcoming-heading">Coming up</h2>
                  <p className="muted">The next scheduled appointments.</p>
                </div>
                <Link to="/appointments?when=upcoming" className="btn btn-secondary btn-sm">
                  View all
                </Link>
              </div>
              {upcoming.data.items.length === 0 ? (
                <p className="empty-inline">Nothing booked yet.</p>
              ) : (
                <Agenda appointments={upcoming.data.items} showDate />
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}

function Kpi({ label, value, to }) {
  return (
    <div className="kpi">
      <dt>{label}</dt>
      <dd className="num">{to ? <Link to={to}>{value}</Link> : value}</dd>
    </div>
  );
}

/** Time on the left, patient and doctor on the right; each row opens the appointment. */
function Agenda({ appointments, showDate, showStatus }) {
  return (
    <ul className="agenda">
      {appointments.map((a) => (
        <li key={a._id} className="agenda-item">
          <span className="agenda-time">{formatTime(a.time)}</span>
          <div className="agenda-main">
            <Link to={`/appointments/${a._id}/edit`} className="row-link">
              {a.patient.fullName}
            </Link>
            <div className="subline">
              {showDate && `${formatDate(a.date)} · `}
              {doctorName(a.doctor)}, {a.reason}
            </div>
          </div>
          {showStatus && <StatusBadge status={a.status} />}
        </li>
      ))}
    </ul>
  );
}

/** First-run guide: the three steps in the order the app needs them, with real progress. */
function GettingStarted({ hasDoctors, hasPatients, hasAppointments }) {
  const steps = [
    { done: hasDoctors, label: 'Add a doctor', detail: 'Set their specialty, days and hours.', to: '/doctors/new' },
    { done: hasPatients, label: 'Register a patient', detail: 'NIC, date of birth and phone.', to: '/patients/new' },
    { done: hasAppointments, label: 'Book an appointment', detail: 'Pick a doctor and a free time.', to: '/appointments/new' },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;

  return (
    <section className="panel getting-started" aria-labelledby="start-heading">
      <div className="panel-head">
        <h2 id="start-heading">Get started</h2>
        <span className="muted num">
          {doneCount} of {steps.length} done
        </span>
      </div>
      <ol className="steps">
        {steps.map((step) => (
          <li key={step.label} className={step.done ? 'step step-done' : 'step'}>
            <span className="step-mark" aria-hidden="true">
              {step.done && <Icon name="check" size={14} />}
            </span>
            <div>
              {step.done ? <strong>{step.label}</strong> : <Link to={step.to}>{step.label}</Link>}
              <p className="subline">{step.done ? 'Done' : step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
