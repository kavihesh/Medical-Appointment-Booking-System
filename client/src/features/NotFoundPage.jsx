import { Link } from 'react-router';
import { PageHeader } from '../components/PageHeader.jsx';

export function NotFoundPage() {
  return (
    <>
      <PageHeader title="Page not found" subtitle="The page you are looking for does not exist or was moved." />
      <Link to="/" className="btn btn-primary">
        Go to dashboard
      </Link>
    </>
  );
}
