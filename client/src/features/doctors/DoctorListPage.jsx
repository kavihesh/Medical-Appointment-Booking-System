import { DAYS_OF_WEEK, DOCTOR_STATUSES, LIMITS, SPECIALTIES } from '@mab/shared';
import { Link } from 'react-router';
import { Avatar } from '../../components/Avatar.jsx';
import { ConfirmDialog } from '../../components/ConfirmDialog.jsx';
import { Icon } from '../../components/Icon.jsx';
import { ListToolbar } from '../../components/ListToolbar.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { Pagination } from '../../components/Pagination.jsx';
import { RowActions } from '../../components/RowActions.jsx';
import { SearchInput } from '../../components/SearchInput.jsx';
import { SelectFilter } from '../../components/SelectFilter.jsx';
import { EmptyState, ErrorMessage, Loading } from '../../components/States.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useDeleteConfirmation } from '../../hooks/useDeleteConfirmation.js';
import { useListParams } from '../../hooks/useListParams.js';
import { doctorName, formatDays, formatFee, formatHours, plural } from '../../lib/format.js';
import { DOCTOR_DELETE_MESSAGE } from './doctorText.js';

const SORT_OPTIONS = [
  { value: 'fullName:asc', label: 'Name, A to Z' },
  { value: 'specialty:asc', label: 'Specialty' },
  { value: 'consultationFee:asc', label: 'Fee, lowest first' },
  { value: 'consultationFee:desc', label: 'Fee, highest first' },
  { value: 'createdAt:desc', label: 'Newest first' },
];

const DEFAULTS = {
  q: '',
  specialty: '',
  day: '',
  status: '',
  sort: 'fullName',
  order: 'asc',
  page: '1',
  limit: String(LIMITS.PAGE_SIZE_DEFAULT),
};

export function DoctorListPage() {
  const { params, setParams, apiQuery } = useListParams(DEFAULTS);
  const { data, error, isLoading, reload } = useApi(`/doctors?${apiQuery}`);
  const { requestDelete, dialogProps } = useDeleteConfirmation({
    describe: (d) => ({ path: `/doctors/${d._id}`, name: doctorName(d), message: DOCTOR_DELETE_MESSAGE }),
    onDeleted: reload,
  });

  const activeFilterCount = [params.specialty, params.day, params.status].filter(Boolean).length;
  const hasFilters = Boolean(params.q) || activeFilterCount > 0;

  return (
    <>
      <PageHeader
        title="Doctors"
        subtitle={data && `${plural(data.total, 'doctor')} ${hasFilters ? 'found' : 'at the clinic'}`}
      >
        <Link to="/doctors/new" className="btn btn-primary">
          <Icon name="plus" size={16} />
          Add doctor
        </Link>
      </PageHeader>

      <ListToolbar
        activeFilterCount={activeFilterCount}
        onClear={() => setParams({ specialty: '', day: '', status: '' })}
        search={
          <SearchInput
            id="doctor-search"
            label="Search"
            placeholder="Search doctors"
            value={params.q}
            onSearch={(q) => setParams({ q })}
          />
        }
      >
        <SelectFilter
          id="specialty-filter"
          label="Specialty"
          allLabel="All specialties"
          options={SPECIALTIES}
          value={params.specialty}
          onChange={(specialty) => setParams({ specialty })}
        />
        <SelectFilter
          id="day-filter"
          label="Works on"
          allLabel="Any day"
          options={DAYS_OF_WEEK}
          value={params.day}
          onChange={(day) => setParams({ day })}
        />
        <SelectFilter
          id="status-filter"
          label="Status"
          allLabel="All statuses"
          options={DOCTOR_STATUSES}
          value={params.status}
          onChange={(status) => setParams({ status })}
        />
        <SelectFilter
          id="doctor-sort"
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
        <EmptyState title={hasFilters ? 'No doctors match your search' : 'No doctors yet'}>
          {hasFilters ? (
            <p>Try another search or clear the filters.</p>
          ) : (
            <Link to="/doctors/new" className="btn btn-primary">
              Add the first doctor
            </Link>
          )}
        </EmptyState>
      )}
      {data && data.items.length > 0 && (
        <div className={`panel table-panel${isLoading ? ' is-refreshing' : ''}`} aria-busy={isLoading}>
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Doctor</th>
                <th scope="col">Days</th>
                <th scope="col">Hours</th>
                <th scope="col" className="num">
                  Fee
                </th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((d) => (
                <tr key={d._id}>
                  <td className="cell-primary">
                    <div className="identity">
                      <Avatar name={d.fullName} />
                      <div>
                        <Link to={`/doctors/${d._id}`} className="row-link">
                          {doctorName(d)}
                        </Link>
                        <div className="subline">{d.specialty}</div>
                      </div>
                    </div>
                  </td>
                  <td className="cell-meta" data-label="Days">
                    {formatDays(d.availableDays)}
                  </td>
                  <td className="cell-meta tnum" data-label="Hours">
                    {formatHours(d.startTime, d.endTime)}
                    <div className="subline">{d.slotMinutes} min per patient</div>
                  </td>
                  <td className="cell-meta num" data-label="Fee">
                    {formatFee(d.consultationFee)}
                  </td>
                  <td className="cell-status">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="cell-actions">
                    <RowActions label={doctorName(d)} editTo={`/doctors/${d._id}/edit`} onDelete={() => requestDelete(d)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination {...data} noun="doctors" onPageChange={(page) => setParams({ page })} />
        </div>
      )}

      <ConfirmDialog {...dialogProps} />
    </>
  );
}
