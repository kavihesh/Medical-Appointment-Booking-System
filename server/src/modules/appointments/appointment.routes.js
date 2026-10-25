import { Router } from 'express';
import { APPOINTMENT_STATUSES, appointmentSchema, appointmentUpdateSchema, OBJECT_ID_PATTERN } from '@mab/shared';
import { z } from 'zod';
import { listQuerySchema } from '../../lib/listQuery.js';
import { checkObjectId, validateBody, validateQuery } from '../../middleware/validate.js';
import * as appointments from './appointment.service.js';

const listQuery = listQuerySchema({
  sortFields: ['date', 'createdAt', 'status'],
  filters: {
    when: z.enum(['today', 'upcoming', 'past']).optional(),
    date: z.iso.date().optional(),
    status: z.enum(APPOINTMENT_STATUSES).optional(),
    doctor: z.string().regex(OBJECT_ID_PATTERN).optional(),
    patient: z.string().regex(OBJECT_ID_PATTERN).optional(),
  },
});

export const appointmentRoutes = Router();
appointmentRoutes.param('id', checkObjectId);

appointmentRoutes.get('/', validateQuery(listQuery), async (req, res) => {
  res.json(await appointments.listAppointments(res.locals.query));
});

appointmentRoutes.get('/:id', async (req, res) => {
  res.json(await appointments.getAppointment(req.params.id));
});

appointmentRoutes.post('/', validateBody(appointmentSchema), async (req, res) => {
  res.status(201).json(await appointments.createAppointment(req.body));
});

appointmentRoutes.put('/:id', validateBody(appointmentUpdateSchema), async (req, res) => {
  res.json(await appointments.updateAppointment(req.params.id, req.body));
});

appointmentRoutes.delete('/:id', async (req, res) => {
  await appointments.deleteAppointment(req.params.id);
  res.status(204).end();
});
