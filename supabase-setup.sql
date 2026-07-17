-- Run this once in Supabase Dashboard > SQL Editor.
-- Replace owner email in the last policy with the bakery owner's login email.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id),
  customer_name text not null,
  customer_phone text not null,
  order_type text not null check (order_type in ('Pickup', 'Delivery')),
  address text,
  note text,
  payment_method text not null,
  transaction_id text,
  total numeric(10,2) not null,
  status text not null default 'New' check (status in ('New', 'Confirmed', 'Preparing', 'Ready', 'Completed', 'Cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_name text not null,
  price numeric(10,2) not null,
  quantity integer not null check (quantity > 0)
);

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "customer can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "customer can add own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "customer can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "customer can view own orders" on public.orders for select using (auth.uid() = customer_id);
create policy "customer can add own orders" on public.orders for insert with check (auth.uid() = customer_id);
create policy "customer can view own order items" on public.order_items for select using (exists (select 1 from public.orders where orders.id = order_items.order_id and orders.customer_id = auth.uid()));
create policy "customer can add own order items" on public.order_items for insert with check (exists (select 1 from public.orders where orders.id = order_items.order_id and orders.customer_id = auth.uid()));

-- Owner dashboard policies: replace this email before running.
create policy "owner can manage all orders" on public.orders for all using ((auth.jwt() ->> 'email') = 'YOUR-OWNER-EMAIL@example.com') with check ((auth.jwt() ->> 'email') = 'YOUR-OWNER-EMAIL@example.com');
create policy "owner can view all items" on public.order_items for select using ((auth.jwt() ->> 'email') = 'YOUR-OWNER-EMAIL@example.com');
create policy "owner can view customer profiles" on public.profiles for select using ((auth.jwt() ->> 'email') = 'YOUR-OWNER-EMAIL@example.com');
