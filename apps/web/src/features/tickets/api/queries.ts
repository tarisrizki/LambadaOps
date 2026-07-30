import { queryOptions } from '@tanstack/react-query';
import { ticketKeys } from './query-keys';
import { getTickets, getTicket } from './client';

export const ticketQueries = {
  list: () =>
    queryOptions({
      queryKey: ticketKeys.lists(),
      queryFn: () => getTickets(),
    }),
  detail: (id: number) =>
    queryOptions({
      queryKey: ticketKeys.detail(id),
      queryFn: () => getTicket(id),
    }),
};
