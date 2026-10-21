import type { Department, PrismaClient, Role, User } from "@prisma/client";
import type { CreateUserInput, UpdateUserInput } from "@robustify/shared";
import bcrypt from "bcryptjs";
import { HttpError } from "../../http/errors";

export interface SessionUser {
  id: number;
  username: string;
  email: string;
  role: Role;
  department: Department;
}

// Cheap hashes keep the test suite fast; real deployments use cost 12.
export const BCRYPT_ROUNDS = process.env.NODE_ENV === "test" ? 4 : 12;

export const hashPassword = (password: string) => bcrypt.hash(password, BCRYPT_ROUNDS);

export function toSessionUser(user: User): SessionUser {
  const { id, username, email, role, department } = user;
  return { id, username, email, role, department };
}

export async function listUsers(
  prisma: PrismaClient,
  filter: { role?: Role; department?: Department },
) {
  const users = await prisma.user.findMany({
    where: filter,
    orderBy: [{ department: "asc" }, { username: "asc" }],
  });
  return users.map(toSessionUser);
}

export async function createUser(prisma: PrismaClient, input: CreateUserInput) {
  const { password, ...rest } = input;
  const user = await prisma.user.create({
    data: { ...rest, passwordHash: await hashPassword(password) },
  });
  return toSessionUser(user);
}

export async function updateUser(
  prisma: PrismaClient,
  actor: SessionUser,
  id: number,
  input: UpdateUserInput,
) {
  if (id === actor.id && input.role && input.role !== "ADMIN") {
    throw HttpError.conflict("You cannot remove your own admin role");
  }
  const { password, ...rest } = input;
  const user = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id },
      data: { ...rest, ...(password ? { passwordHash: await hashPassword(password) } : {}) },
    });
    // A new password signs the user out everywhere.
    if (password) await tx.session.deleteMany({ where: { userId: id } });
    return updated;
  });
  return toSessionUser(user);
}

export async function deleteUser(prisma: PrismaClient, actor: SessionUser, id: number) {
  if (id === actor.id) throw HttpError.conflict("You cannot delete your own account");
  // Assigned orders, complaints and order history keep their records; the link is cleared.
  await prisma.user.delete({ where: { id } });
}
