import { Inngest } from "inngest";
import prisma from "../configs/prisma.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "project-management" });

// A function to save user to the database
const syncUserCreation = inngest.createFunction(
    { id: 'sync-user-from-clerk', triggers: { event: 'clerk/user.created' } },
    async ({ event }) => {
        const { data } = event
        await prisma.user.create({
            data: {
                id: data.id,
                email: data?.email_addresses[0]?.email_address,
                name: data?.first_name + " " + data?.last_name,
                image: data?.image_url
            }
        })
    }
)

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
    {id: 'sync-worksapce-from-clerk'},
    {event: 'clerk/organization.created'},
    async ({event}) => {
        const {data} = event
        await prisma.worksapce.create({
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
            userId: data.created_by,
            worksapceId: data.id,
            role: "ADMIN"
        })
    }
)

// Inngest function to update workspace on a database
const syncWorkspaceUpdation = inngest.createFunction(
    {id: 'update-worksapce-from-clerk'},
    {event: 'clerk/organization.updated'},
    async ({event}) => {
        const {data} = event
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
    {id: 'delete-worksapce-from-clerk'},
    {event: 'clerk/organization.deleted'},
    async ({event}) => {
        const {data} = event;
        await prisma.workspace.delete({
            where: {
                id: data.id
            }
        })
    }
)

// Inngest function to save workspace member data to a database
const syncWorkspaceMemberCreation = inngest.createFunction(
    {id: 'sync-worksapce-member-from-clerk'},
    {event: 'clerk/organizationInvitation.accepted'},
    async ({event}) => {
        const {data} = event
        await prisma.workspaceMember.create({
            data: {
                userId: data.user_id,
                workspaceId: data.organization_id,
                id: String(data.role_name).toUpperCase(),
            }
        })
    }
)

// Create an empty array where we'll export future Inngest functions
export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation, syncWorkspaceCreation ,syncWorkspaceDeletion, syncWorkspaceMemberCreation, syncWorkspaceUpdation];