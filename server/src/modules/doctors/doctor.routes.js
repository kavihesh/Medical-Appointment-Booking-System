import { Router } from 'express';
import { DAYS_OF_WEEK, DOCTOR_STATUSES, doctorSchema, SPECIALTIES } from '@mab/shared';
import { z } from 'zod';
import { listQuerySchema } from '../../lib/listQuery.js';
import { checkObjectId, validateBody, validateQuery } from '../../middleware/validate.js';
import * as doctors from './doctor.service.js';

const listQuery = listQuerySchema({
  sortFields: ['fullName', 'consultationFee', 'specialty', 'createdAt'],
  filters: {
    specialty: z.enum(SPECIALTIES).optional(),
    status: z.enum(DOCTOR_STATUSES).optional(),
    day: z.enum(DAYS_OF_WEEK).optional(),
  },
});

const slotsQuery = z.strictObject({ date: z.iso.date('Choose a valid date') });

export const doctorRoutes = Router();
doctorRoutes.param('id', checkObjectId);

doctorRoutes.get('/', validateQuery(listQuery), async (req, res) => {
  res.json(await doctors.listDoctors(res.locals.query));
});

doctorRoutes.get('/:id', async (req, res) => {
  res.json(await doctors.getDoctor(req.params.id));
});

doctorRoutes.get('/:id/slots', validateQuery(slotsQuery), async (req, res) => {
  res.json(await doctors.getSlots(req.params.id, res.locals.query.date));
});

doctorRoutes.post('/', validateBody(doctorSchema), async (req, res) => {
  res.status(201).json(await doctors.createDoctor(req.body));
});

doctorRoutes.put('/:id', validateBody(doctorSchema), async (req, res) => {
  res.json(await doctors.updateDoctor(req.params.id, req.body));
});

doctorRoutes.delete('/:id', async (req, res) => {
  await doctors.deleteDoctor(req.params.id);
  res.status(204).end();
});
