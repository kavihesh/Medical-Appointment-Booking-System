import { APPOINTMENT_STATUSES, LIMITS } from '@mab/shared';
import { Link } from 'react-router';
import { Avatar } from '../../components/Avatar.jsx';
import { ConfirmDialog } from '../../components/ConfirmDialog.jsx';
import { Icon } from '../../components/Icon.jsx';
import { ListToolbar } from '../../components/ListToolbar.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { Pagination } from '../../components/Pagination.jsx';
import { RowActions } from '../../components/RowActions.jsx';
import { SelectFilter } from '../../components/SelectFilter.jsx';
import { EmptyState, ErrorMessage, Loading } from '../../components/States.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { OPTIONS_PAGE_SIZE } from '../../config.js';
import { useApi } from '../../hooks/useApi.js';
import { useDeleteConfirmation } from '../../hooks/useDeleteConfirmation.js';
import { useListParams } from '../../hooks/useListParams.js';
import { doctorName, formatDate, formatTime, plural } from '../../lib/format.js';
import { describeAppointmentDelete } from './appointmentText.js';

const WHEN_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'upcoming', label: 'Today and later' },
  { value: 'past', label: 'Past' },
];

const SORT_OPTIONS = [
  { value: 'date:asc', label: 'Date, soonest first' },
  { value: 'date:desc', label: 'Date, latest first' },
  { value: 'createdAt:desc', label: 'Recently booked' },
  { value: 'status:asc', label: 'Status' },
];

const DEFAULTS = {
  when: '',
  status: '',
  doctor: '',
  sort: 'date',
  order: 'asc',
  page: '1',
  limit: String(LIMITS.PAGE_SIZE_DEFAULT),
};

export function AppointmentListPage() {
  const { params, setParams, apiQuery } = useListParams(DEFAULTS);
  const { data, error, isLoading, reload } = useApi(`/appointments?${apiQuery}`);
  const { data: doctors } = useApi(`/doctors?sort=fullName&limit=${OPTIONS_PAGE_SIZE}`);
  const { requestDelete, dialogProps } = useDeleteConfirmation({ describe: describeAppointmentDelete, onDeleted: reload });

  const doctorOptions = (doctors?.items ?? []).map((d) => ({ value: d._id, label: doctorName(d) }));
  const activeFilterCount = [params.when, params.status, params.doctor].filter(Boolean).length;

  return (
    <>
      <PageHeader
        title="Appointments"
        subtitle={data && `${plural(data.total, 'appointment')} ${activeFilterCount ? 'found' : 'on record'}`}
      >
        <Link to="/appointments/new" className="btn btn-primary">
          <Icon name="plus" size={16} />
          Book appointment
        </Link>
      </PageHeader>

      <ListToolbar activeFilterCount={activeFilterCount} onClear={() => setParams({ when: '', status: '', doctor: '' })}>
        <SelectFilter
          id="when-filter"
          label="When"
          allLabel="Any date"
          options={WHEN_OPTIONS}
          value={params.when}
          onChange={(when) => setParams({ when })}
        />
        <SelectFilter
          id="doctor-filter"
          label="Doctor"
          allLabel="All doctors"
          options={doctorOptions}
          value={params.doctor}
          onChange={(doctor) => setParams({ doctor })}
        />
        <SelectFilter
          id="status-filter"
          label="Status"
          allLabel="All statuses"
          options={APPOINTMENT_STATUSES}
          value={params.status}
          onChange={(status) => setParams({ status })}
        />
        <SelectFilter
          id="appointment-sort"
          label="Sort by"
          options={SORT_OPTIONS}
          value={`${params.sort}:${params.order}`}
          onChange={(value) => {
            const [sort, order] = value.split(':');
            setParams({ sort, order });
          }}
        />
      </ListToolbar>

      {error && <ErrorMessage error={error} onRetry={reload} />}
      {!error && !data && <Loading />}
      {data && data.items.length === 0 && (
        <EmptyState title={activeFilterCount ? 'No appointments match these filters' : 'No appointments yet'}>
          {activeFilterCount ? (
            <p>Try another date range, doctor or status.</p>
          ) : (
            <Link to="/appointments/new" className="btn btn-primary">
              Book the first appointment
            </Link>
          )}
        </EmptyState>
      )}
      {data && data.items.length > 0 && (
        <div className={`panel table-panel${isLoading ? ' is-refreshing' : ''}`} aria-busy={isLoading}>
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Patient</th>
                <th scope="col">When</th>
                <th scope="col">Doctor</th>
                <th scope="col">Reason</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((a) => (
                <tr key={a._id}>
                  <td className="cell-primary">
                    <div className="identity">
                      <Avatar name={a.patient.fullName} />
                      <div>
                        <Link to={`/patients/${a.patient._id}`} className="row-link">
                          {a.patient.fullName}
                        </Link>
                        <div className="subline">NIC {a.patient.nic}</div>
                      </div>
                    </div>
                  </td>
                  <td className="cell-meta tnum" data-label="When">
                    {formatDate(a.date)}
                    <div className="subline">{formatTime(a.time)}</div>
                  </td>
                  <td className="cell-meta" data-label="Doctor">
                    <Link to={`/doctors/${a.doctor._id}`} className="plain-link">
                      {doctorName(a.doctor)}
                    </Link>
                    <div className="subline">{a.doctor.specialty}</div>
                  </td>
                  <td className="cell-meta" data-label="Reason">
                    {a.reason}
                  </td>
                  <td className="cell-status">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="cell-actions">
                    <RowActions
                      label={`appointment of ${a.patient.fullName}`}
                      editTo={`/appointments/${a._id}/edit`}
                      onDelete={() => requestDelete(a)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination {...data} noun="appointments" onPageChange={(page) => setParams({ page })} />
        </div>
      )}

      <ConfirmDialog {...dialogProps} />
    </>
  );
}
