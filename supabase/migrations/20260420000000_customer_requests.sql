create table if not exists customer_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  request_text text not null,
  suggested_dish text,
  status text default 'new' check (status in ('new', 'seen', 'added_to_menu', 'rejected')),
  restaurant_id uuid references restaurants(id) on delete cascade,
  admin_note text
);

alter table customer_requests enable row level security;

-- Admins can do everything
create policy "Admins manage customer requests"
  on customer_requests for all
  using (true)
  with check (true);

-- Anyone can insert (anonymous clients)
create policy "Anyone can insert customer requests"
  on customer_requests for insert
  with check (true);
