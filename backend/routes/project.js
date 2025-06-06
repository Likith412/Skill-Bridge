const express = require('express');
const {
  handleCreateProject,
  handleGetProjects,
  handleUpdateProject,
  handleDeleteProject,
} = require('../controllers/project');
const router = express.Router();
router.post('/create', handleCreateProject);
router.get('/getprojects', handleGetProjects);
router.put('/update/:id', handleUpdateProject);
router.delete('/delete/:id', handleDeleteProject);
module.exports = router;