import prisma from "../configs/prisma.js"
import sendEmail from "../configs/nodemailer.js"
import { inngest } from "../inngest/index.js"

// create task
export const createTask = async(req, res) => {
    try {
        const auth = req.auth() // Clerk middleware returns req.auth as a function
        const userId = auth?.userId
        const { projectId, title, description, type, status, priority, assigneeId, due_date } = req.body
        const origin = req.get('origin') || process.env.CLIENT_URL || 'http://localhost:5173'

        if (!projectId || !title || !due_date) {
            return res.status(400).json({ message: "Project, title and due date are required" })
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { members: { include: { user: true } } }
        })

        if (!project) {
            return res.status(404).json({ message: "Project not found" })
        } else if (project.team_lead !== userId) {
            return res.status(403).json({ message: "You do not have admin privileges for this project" })
        }

        const validAssigneeId = assigneeId || project.team_lead
        const isValidAssignee = validAssigneeId === project.team_lead ||
            project.members.some((member) => member.user.id === validAssigneeId)

        if (!isValidAssignee) {
            return res.status(403).json({ message: "Assignee is not a member of this project or workspace" })
        }

        const task = await prisma.task.create({
            data: {
                projectId,
                title,
                description: description || "",
                type: type || "TASK",
                status: status || "TODO",
                priority: priority || "MEDIUM",
                assigneeId: validAssigneeId,
                due_date: new Date(due_date)
            }
        })

        const taskWithAssignee = await prisma.task.findUnique({
            where: { id: task.id },
            include: { assignee: true, project: true }
        })

        if (taskWithAssignee?.assignee?.email) {
            await sendEmail({
                to: taskWithAssignee.assignee.email,
                subject: `New task assigned: ${taskWithAssignee.title}`,
                body: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                        <h2 style="margin: 0 0 12px;">New task assigned</h2>
                        <p>Hello ${taskWithAssignee.assignee.name || 'there'},</p>
                        <p>You have been assigned to the task: <strong>${taskWithAssignee.title}</strong>.</p>
                        <p>Project: ${taskWithAssignee.project.name}</p>
                        <p>Due date: ${new Date(taskWithAssignee.due_date).toLocaleDateString()}</p>
                        <p><a href="${origin}">Open task</a></p>
                    </div>
                `
            })
        }

        try {
            await inngest.send({
                name: 'app/task.assigned',
                data: {
                    taskId: task.id,
                    origin
                }
            })
        } catch (inngestError) {
            console.log('Task notification failed but task was created:', inngestError)
        }

        return res.json({ task: taskWithAssignee, message: "Task created successfully" })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: error.code || error.message })
    }

}

// update task
export const updateTask = async(req, res) => {
    try {
        const auth = req.auth()
        const userId = auth?.userId
        const { id } = req.params
        const { status, title, description, priority, type, due_date, assigneeId } = req.body

        const task = await prisma.task.findUnique({
            where: { id }
        })

        if (!task) {
            return res.status(404).json({ message: "Task not found" })
        }

        const project = await prisma.project.findUnique({
            where: { id: task.projectId },
            include: { members: { include: { user: true } } }
        })

        if (!project) {
            return res.status(404).json({ message: "Project not found" })
        }

        if (project.team_lead !== userId) {
            return res.status(403).json({ message: "You do not have admin privileges for this project" })
        }

        const updatedTask = await prisma.task.update({
            where: { id },
            data: {
                ...(status && { status }),
                ...(title && { title }),
                ...(description !== undefined && { description }),
                ...(priority && { priority }),
                ...(type && { type }),
                ...(due_date && { due_date: new Date(due_date) }),
                ...(assigneeId !== undefined && { assigneeId })
            }
        })

        res.json({ task: updatedTask, message: "Task updated successfully" })

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.code || error.message })
    }
}

// delete task
export const deleteTask = async(req, res) => {
    try {
        const auth = req.auth()
        const userId = auth?.userId
        const { taskId, tasksIds } = req.body

        const rawIds = taskId ?? tasksIds ?? []
        const taskIds = (Array.isArray(rawIds) ? rawIds : [rawIds]).filter(Boolean)

        if (!taskIds.length) {
            return res.status(400).json({ message: "Task id is required" })
        }

        const tasks = await prisma.task.findMany({
            where: { id: { in: taskIds } }
        })

        if (tasks.length === 0) {
            return res.status(404).json({ message: "Task not found" })
        }

        const project = await prisma.project.findUnique({
            where: { id: tasks[0].projectId },
            include: { members: { include: { user: true } } }
        })

        if (!project) {
            return res.status(404).json({ message: "Project not found" })
        }

        if (project.team_lead !== userId) {
            return res.status(403).json({ message: "You do not have admin privileges for this project" })
        }

        await prisma.task.deleteMany({
            where: { id: { in: taskIds } }
        })

        res.json({ message: "Task deleted successfully" })

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.code || error.message })
    }
}