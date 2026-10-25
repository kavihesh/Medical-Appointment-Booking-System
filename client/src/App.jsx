import { BrowserRouter, Route, Routes } from 'react-router';
import { Layout } from './components/Layout.jsx';
import { ToastProvider } from './components/Toast.jsx';
import { AppointmentFormPage } from './features/appointments/AppointmentFormPage.jsx';
import { AppointmentListPage } from './features/appointments/AppointmentListPage.jsx';
import { DashboardPage } from './features/dashboard/DashboardPage.jsx';
import { DoctorDetailsPage } from './features/doctors/DoctorDetailsPage.jsx';
import { DoctorFormPage } from './features/doctors/DoctorFormPage.jsx';
import { DoctorListPage } from './features/doctors/DoctorListPage.jsx';
import { NotFoundPage } from './features/NotFoundPage.jsx';
import { PatientDetailsPage } from './features/patients/PatientDetailsPage.jsx';
import { PatientFormPage } from './features/patients/PatientFormPage.jsx';
import { PatientListPage } from './features/patients/PatientListPage.jsx';

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="appointments">
              <Route index element={<AppointmentListPage />} />
              <Route path="new" element={<AppointmentFormPage />} />
              <Route path=":id/edit" element={<AppointmentFormPage />} />
            </Route>
            <Route path="doctors">
              <Route index element={<DoctorListPage />} />
              <Route path="new" element={<DoctorFormPage />} />
              <Route path=":id" element={<DoctorDetailsPage />} />
              <Route path=":id/edit" element={<DoctorFormPage />} />
            </Route>
            <Route path="patients">
              <Route index element={<PatientListPage />} />
              <Route path="new" element={<PatientFormPage />} />
              <Route path=":id" element={<PatientDetailsPage />} />
              <Route path=":id/edit" element={<PatientFormPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
