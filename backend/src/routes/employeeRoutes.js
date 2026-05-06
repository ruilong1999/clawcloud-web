import express from 'express';
import {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  toggleEmployee,
  deleteEmployee,
  cloneEmployee
} from '../controllers/employeeController.js';

const router = express.Router();

router.route('/')
  .get(getEmployees)
  .post(createEmployee);

router.route('/:id')
  .get(getEmployee)
  .put(updateEmployee)
  .delete(deleteEmployee);

router.put('/:id/toggle', toggleEmployee);
router.post('/:id/clone', cloneEmployee);

export default router;
