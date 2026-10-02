/**
 * Shared plumbing for the admin API routes: the auth guard, error shape and the
 * resource registry that maps a URL segment to repository functions.
 */

import { NextResponse } from 'next/server';
import { getSessionUser } from './auth';
import * as repo from './repo';
import type { Client, Delivery, Message, Product, Promo, SystemSettings } from '../types';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, 'Not signed in');
  return user;
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data as object, { status });
}

export function fail(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  // Database outages and malformed JSON land here; never leak internals to the client.
  console.error('[admin-api]', error);
  const message = error instanceof Error ? error.message : 'Unexpected error';
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError(400, 'Invalid JSON body');
  }
}

type Resource<T> = {
  list: (includeArchived?: boolean) => Promise<T[]>;
  save: (input: T) => Promise<T>;
  remove: (id: string) => Promise<void>;
  /** Builds a complete record from a partial payload (used for PATCH-style updates). */
  merge?: (input: Partial<T>, existing: T | undefined) => T;
};

export const RESOURCES: Record<string, Resource<unknown>> = {
  products: {
    list: (includeArchived) => repo.listProducts(includeArchived),
    save: (input) => repo.saveProduct(input as Product),
    remove: (id) => repo.deleteProduct(id),
  },
  promos: {
    list: () => repo.listPromos(),
    save: (input) => repo.savePromo(input as Promo),
    remove: (id) => repo.deletePromo(id),
  },
  clients: {
    list: () => repo.listClients(),
    save: (input) => repo.saveClient(input as Client),
    remove: (id) => repo.deleteClient(id),
  },
  deliveries: {
    list: () => repo.listDeliveries(),
    save: (input) => repo.saveDelivery(input as Delivery),
    remove: (id) => repo.deleteDelivery(id),
  },
  messages: {
    list: () => repo.listMessages(),
    save: (input) => repo.saveMessage(input as Message),
    remove: (id) => repo.deleteMessage(id),
  },
};

export type ResourceName = keyof typeof RESOURCES;

export function getResource(name: string): Resource<unknown> {
  const resource = RESOURCES[name];
  if (!resource) throw new ApiError(404, `Unknown resource "${name}"`);
  return resource;
}

export async function loadSettings(): Promise<SystemSettings> {
  return repo.getSettings();
}
