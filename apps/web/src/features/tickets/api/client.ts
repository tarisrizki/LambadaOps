import { api } from '@/lib/api';
import type { 
  CreateTicketInput, 
  AssignTicketInput, 
  UpdateTicketStatusInput, 
  AddTicketCommentInput 
} from '../schemas';

export async function getTickets() {
  const res = await api.api.tickets.$get();
  if (!res.ok) {
    throw new Error('Failed to fetch tickets');
  }
  const json = await res.json();
  return json.data;
}

export async function getTicket(id: number) {
  const res = await api.api.tickets[':id'].$get({
    param: { id: String(id) },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch ticket details');
  }
  const json = await res.json();
  return json.data;
}

export async function createTicket(payload: CreateTicketInput) {
  // Coerce assetId from empty string to undefined if needed for the backend
  const data = {
    ...payload,
    assetId: payload.assetId === '' ? undefined : Number(payload.assetId),
  };
  
  const res = await api.api.tickets.$post({
    json: data,
  });
  if (!res.ok) {
    throw new Error('Failed to create ticket');
  }
  const json = await res.json();
  return json.data;
}

export async function assignTicket(id: number, payload: AssignTicketInput) {
  const res = await api.api.tickets[':id'].assign.$post({
    param: { id: String(id) },
    json: payload,
  });
  if (!res.ok) {
    throw new Error('Failed to assign ticket');
  }
  const json = await res.json();
  return json.data;
}

export async function updateTicketStatus(id: number, payload: UpdateTicketStatusInput) {
  const res = await api.api.tickets[':id'].status.$post({
    param: { id: String(id) },
    json: {
      ...payload,
      comment: payload.comment === '' ? undefined : payload.comment,
    },
  });
  if (!res.ok) {
    throw new Error('Failed to update ticket status');
  }
  const json = await res.json();
  return json.data;
}

export async function addTicketComment(id: number, payload: AddTicketCommentInput) {
  const res = await api.api.tickets[':id'].comments.$post({
    param: { id: String(id) },
    json: payload,
  });
  if (!res.ok) {
    throw new Error('Failed to add ticket comment');
  }
  const json = await res.json();
  return json.data;
}
