const express = require('express')
const router = express.Router()
const employeeController = require('../../app/controllers/admin/employeeController')
const employeePermission = require('../../app/middleware/checkPermission').employeeClass

router.get('/'                  , employeePermission.read   , employeeController.allEmployees)
router.get('/employee/create'   , employeePermission.create , employeeController.employeeCreate)
router.get('/employee/:id'      , employeePermission.update , employeeController.employeeInfo)

router.post('/employee/created' , employeeController.employeeCreated)
router.put('/employee/updated'  , employeeController.employeeUpdate)

router.post('/data/filter'      , employeeController.getFilter)
router.post('/data/positions'   , employeeController.getPositions) 
router.post('/data/stores'      , employeeController.getStores)
router.post('/data/employees'   , employeeController.getEmployees)
router.post('/data/employee'    , employeeController.getEmployee)

module.exports = router