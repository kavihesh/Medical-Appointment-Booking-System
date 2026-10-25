import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { errorHandler, notFound, requestId } from './middleware/errorHandler.js';
import { appointmentRoutes } from './modules/appointments/appointment.routes.js';
import { doctorRoutes } from './modules/doctors/doctor.routes.js';
import { patientRoutes } from './modules/patients/patient.routes.js';

/** Builds the Express app. Kept separate from server.js so tests can run it without a database. */
export function createApp({ clientOrigins }) {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: clientOrigins }));
  app.use(express.json({ limit: '10kb' }));
  app.use(requestId);

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/doctors', doctorRoutes);
  app.use('/api/patients', patientRoutes);
  app.use('/api/appointments', appointmentRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
