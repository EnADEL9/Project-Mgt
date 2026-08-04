import express from 'express'
import { addMember, createProject, updateProject } from '../controllers/projectController'

const projectRouter = express.Router()

projectRouter.post('/', createProject)
projectRouter.Put('/', updateProject)
projectRouter.post('/:projectId/addMember', addMember)

export default projectRouter