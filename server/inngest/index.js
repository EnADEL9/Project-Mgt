import { Inngest } from "inngest";
import prisma from "../configs/prisma.js";
import sendEmail from '../configs/nodemailer.js'

// Create a client to send and receive events
export const inngest = new Inngest({ id: "project-management" });

// // A function to save user to the database
// const syncUserCreation = inngest.createFunction(
//     { id: 'sync-user-from-clerk', triggers: { event: 'clerk/user.created' } },
//     async ({ event }) => {
//         const { data } = event
//         await prisma.user.create({
//             data: {
//                 id: data.id,
//                 email: data?.email_addresses?.[0]?.email_address,
//                 name: data?.first_name + " " + data?.last_name,
//                 image: data?.image_url
//             }
//         })
//     }
// )

// A function to save or update a user in the database
const syncUserCreation = inngest.createFunction(
    { id: 'sync-user-from-clerk', triggers: { event: 'clerk/user.created' } },
    async ({ event }) => {
        const { data } = event;

        // Clean name construction avoiding "undefined undefined"
        const firstName = data?.first_name || '';
        const lastName = data?.last_name || '';
        const name = `${firstName} ${lastName}`.trim() || 'User';

        const email = data?.email_addresses?.[0]?.email_address || '';
        const image = data?.image_url || '';

        await prisma.user.upsert({
            where: { id: data.id },
            update: {
                email,
                name,
                image
            },
            create: {
                id: data.id,
                email,
                name,
                image
            }
        });
    }
);

// A function to delete user from database
const syncUserDeletion = inngest.createFunction(
    { id: 'delete-user-with-clerk', triggers: { event: 'clerk/user.deleted' } },
    async ({ event }) => {
        const { data } = event
        await prisma.user.delete({
            where: {
                id: data.id,
            }
        })
    }
)

// A function to update user in database
const syncUserUpdation = inngest.createFunction(
    { id: 'update-user-from-clerk', triggers: { event: 'clerk/user.updated' } },
    async ({ event }) => {
        const { data } = event
        await prisma.user.update({
            where: {
                id: data.id,
            },
            data: {
                email: data?.email_addresses[0]?.email_address,
                name: data?.first_name + " " + data?.last_name,
                image: data?.image_url
            }
        })
    }
)
// Inngest function to save workspace data to a database
const syncWorkspaceCreation = inngest.createFunction(
    { id: 'sync-workspace-from-clerk', triggers: { event: 'clerk/organization.created' } },
    async ({ event }) => {
        const { data } = event
        await prisma.workspace.create({
            data: {
                id: data.id,
                name: data.name,
                slug: data.slug,
                ownerId: data.created_by,
                image_url: data.image_url,
            }
        })

        // Add creator as an ADMIN member
        await prisma.workspaceMember.create({
            data: {
                userId: data.created_by,
                workspaceId: data.id,
                role: "ADMIN"
            }
        })
    }
)

// Inngest function to update workspace on a database
const syncWorkspaceUpdation = inngest.createFunction(
    { id: 'update-workspace-from-clerk', triggers: { event: 'clerk/organization.updated' } },
    async ({ event }) => {
        const { data } = event
        await prisma.workspace.update({
            where: {
                id: data.id
            },
            data: {
                name: data.name,
                slug: data.slug,
                image_url: data.image_url,
            }
        })
    }
)

// Inngest function to delete workspace from database
const syncWorkspaceDeletion = inngest.createFunction(
    { id: 'delete-workspace-from-clerk', triggers: { event: 'clerk/organization.deleted' } },
    async ({ event }) => {
        const { data } = event;
        await prisma.workspace.delete({
            where: {
                id: data.id
            }
        })
    }
)

// Inngest function to save workspace member data to a database
const syncWorkspaceMemberCreation = inngest.createFunction(
    { id: 'sync-workspace-member-from-clerk', triggers: { event: 'clerk/organizationInvitation.accepted' } },
    async ({ event }) => {
        const { data } = event
        await prisma.workspaceMember.create({
            data: {
                userId: data.user_id,
                workspaceId: data.organization_id,
                role: String(data.role_name).toUpperCase(),
            }
        })
    }
)

const sendTaskAssignmentEmail = inngest.createFunction(
    {
      id: "send-task-assignment-mail",
      triggers: [
        {
          event: "app/task.assigned",
        },
      ],
    },
    async ({ event, step }) => {
      const { taskId, origin } = event.data;
  
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          assignee: true,
          project: true,
        },
      });
  
      if (!task) return;
  
      await sendEmail({
        to: task.assignee.email,
        subject: `New task assignment in ${task.project.name}`,
        body: `
          <p>Hi ${task.assignee.name}</p>
          <p>${task.title}</p>
          <a href="${origin}">View Task</a>
        `,
      });
  
      if (
        new Date(task.due_date).toDateString() !==
        new Date().toDateString()
      ) {
        await step.sleepUntil(
          "wait-for-the-due-date",
          new Date(task.due_date)
        );
  
        await step.run("check-if-task-is-completed", async () => {
          const updatedTask = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
              assignee: true,
              project: true,
            },
          });
  
          if (!updatedTask) return;
  
          if (updatedTask.status !== "DONE") {
            await step.run("send-task-reminder-email", async () => {
              await sendEmail({
                to: updatedTask.assignee.email,
                subject: `Reminder for ${updatedTask.project.name}`,
                body: `
                  <p>Hi ${updatedTask.assignee.name}</p>
                  <p>${updatedTask.title}</p>
                  <a href="${origin}">View Task</a>
                `,
              });
            });
          }
        });
      }
    }
  );
// Create an empty array where we'll export future Inngest functions
export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation, syncWorkspaceCreation ,syncWorkspaceDeletion, syncWorkspaceMemberCreation, syncWorkspaceUpdation, sendTaskAssignmentEmail];