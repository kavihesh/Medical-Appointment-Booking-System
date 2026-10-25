import { Router } from 'express';
import { BLOOD_GROUPS, GENDERS, patientSchema } from '@mab/shared';
import { z } from 'zod';
import { listQuerySchema } from '../../lib/listQuery.js';
import { checkObjectId, validateBody, validateQuery } from '../../middleware/validate.js';
import * as patients from './patient.service.js';

const listQuery = listQuerySchema({
  sortFields: ['fullName', 'dateOfBirth', 'createdAt'],
  filters: {
    gender: z.enum(GENDERS).optional(),
    bloodGroup: z.enum(BLOOD_GROUPS).optional(),
  },
});

export const patientRoutes = Router();
patientRoutes.param('id', checkObjectId);

patientRoutes.get('/', validateQuery(listQuery), async (req, res) => {
  res.json(await patients.listPatients(res.locals.query));
});

patientRoutes.get('/:id', async (req, res) => {
  res.json(await patients.getPatient(req.params.id));
});

patientRoutes.post('/', validateBody(patientSchema), async (req, res) => {
  res.status(201).json(await patients.createPatient(req.body));
});

patientRoutes.put('/:id', validateBody(patientSchema), async (req, res) => {
  res.json(await patients.updatePatient(req.params.id, req.body));
});

patientRoutes.delete('/:id', async (req, res) => {
  await patients.deletePatient(req.params.id);
  res.status(204).end();
});
