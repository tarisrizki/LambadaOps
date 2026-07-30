'use client';

import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addTicketCommentSchema, type AddTicketCommentInput } from '../schemas';
import { useAddTicketComment } from '../api/mutations';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

export function TicketCommentForm({ ticketId }: { ticketId: number }) {
  const mutation = useAddTicketComment();

  const form = useForm<AddTicketCommentInput>({
    resolver: zodResolver(addTicketCommentSchema) as unknown as Resolver<AddTicketCommentInput>,
    defaultValues: {
      content: '',
    },
  });

  const { formState: { errors } } = form;

  const onSubmit = (data: AddTicketCommentInput) => {
    mutation.mutate(
      { id: ticketId, payload: data },
      {
        onSuccess: () => {
          form.reset();
        },
      }
    );
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Textarea
              {...form.register('content')}
              placeholder="Add a comment or update..."
              className={errors.content ? 'border-red-500 min-h-[100px]' : 'min-h-[100px]'}
            />
            {errors.content && <p className="text-sm text-red-500">{errors.content.message}</p>}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
