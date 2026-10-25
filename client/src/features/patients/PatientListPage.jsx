import { BLOOD_GROUPS, GENDERS, LIMITS } from '@mab/shared';
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
import { useApi } from '../../hooks/useApi.js';
import { useDeleteConfirmation } from '../../hooks/useDeleteConfirmation.js';
import { useListParams } from '../../hooks/useListParams.js';
import { formatAge, plural } from '../../lib/format.js';
import { PATIENT_DELETE_MESSAGE } from './patientText.js';

const SORT_OPTIONS = [
  { value: 'fullName:asc', label: 'Name, A to Z' },
  { value: 'fullName:desc', label: 'Name, Z to A' },
  { value: 'dateOfBirth:desc', label: 'Youngest first' },
  { value: 'dateOfBirth:asc', label: 'Oldest first' },
  { value: 'createdAt:desc', label: 'Newest first' },
];

const DEFAULTS = {
  q: '',
  gender: '',
  bloodGroup: '',
  sort: 'fullName',
  order: 'asc',
  page: '1',
  limit: String(LIMITS.PAGE_SIZE_DEFAULT),
};

export function PatientListPage() {
  const { params, setParams, apiQuery } = useListParams(DEFAULTS);
  const { data, error, isLoading, reload } = useApi(`/patients?${apiQuery}`);
  const { requestDelete, dialogProps } = useDeleteConfirmation({
    describe: (p) => ({ path: `/patients/${p._id}`, name: p.fullName, message: PATIENT_DELETE_MESSAGE }),
    onDeleted: reload,
  });

  const activeFilterCount = [params.gender, params.bloodGroup].filter(Boolean).length;
  const hasFilters = Boolean(params.q) || activeFilterCount > 0;

  return (
    <>
      <PageHeader title="Patients" subtitle={data && `${plural(data.total, 'patient')} ${hasFilters ? 'found' : 'registered'}`}>
        <Link to="/patients/new" className="btn btn-primary">
          <Icon name="plus" size={16} />
          Add patient
        </Link>
      </PageHeader>

      <ListToolbar
        activeFilterCount={activeFilterCount}
        onClear={() => setParams({ gender: '', bloodGroup: '' })}
        search={
          <SearchInput
            id="patient-search"
            label="Search"
            placeholder="Search by name, NIC or phone"
            value={params.q}
            onSearch={(q) => setParams({ q })}
          />
        }
      >
        <SelectFilter
          id="gender-filter"
          label="Gender"
          allLabel="All genders"
          options={GENDERS}
          value={params.gender}
          onChange={(gender) => setParams({ gender })}
        />
        <SelectFilter
          id="blood-filter"
          label="Blood group"
          allLabel="All blood groups"
          options={BLOOD_GROUPS}
          value={params.bloodGroup}
          onChange={(bloodGroup) => setParams({ bloodGroup })}
        />
        <SelectFilter
          id="patient-sort"
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
        <EmptyState title={hasFilters ? 'No patients match your search' : 'No patients yet'}>
          {hasFilters ? (
            <p>Try another name or NIC, or clear the filters.</p>
          ) : (
            <Link to="/patients/new" className="btn btn-primary">
              Register the first patient
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
                <th scope="col">NIC</th>
                <th scope="col">Age</th>
                <th scope="col">Phone</th>
                <th scope="col">Blood</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p._id}>
                  <td className="cell-primary">
                    <div className="identity">
                      <Avatar name={p.fullName} />
                      <div>
                        <Link to={`/patients/${p._id}`} className="row-link">
                          {p.fullName}
                        </Link>
                        <div className="subline">{p.gender}</div>
                      </div>
                    </div>
                  </td>
                  <td className="cell-meta tnum" data-label="NIC">
                    {p.nic}
                  </td>
                  <td className="cell-meta tnum" data-label="Age">
                    {formatAge(p.dateOfBirth)}
                  </td>
                  <td className="cell-meta tnum" data-label="Phone">
                    {p.phone}
                  </td>
                  <td className="cell-meta" data-label="Blood">
                    {p.bloodGroup || '-'}
                  </td>
                  <td className="cell-actions">
                    <RowActions label={p.fullName} editTo={`/patients/${p._id}/edit`} onDelete={() => requestDelete(p)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination {...data} noun="patients" onPageChange={(page) => setParams({ page })} />
        </div>
      )}

      <ConfirmDialog {...dialogProps} />
    </>
  );
}
