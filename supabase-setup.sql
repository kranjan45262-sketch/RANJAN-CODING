-- Run this once in Supabase Dashboard > SQL Editor.
-- Replace owner email in the last policy with the bakery owner's login email.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists role text not null default 'customer';

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

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  price numeric(10,2) not null check (price >= 0),
  image_url text not null,
  description text not null default '',
  in_stock boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.products enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email), coalesce(new.raw_user_meta_data ->> 'phone', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'); $$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "customer can view own profile" on public.profiles;
drop policy if exists "customer can add own profile" on public.profiles;
drop policy if exists "customer can update own profile" on public.profiles;
drop policy if exists "customer can view own orders" on public.orders;
drop policy if exists "customer can add own orders" on public.orders;
drop policy if exists "customer can view own order items" on public.order_items;
drop policy if exists "customer can add own order items" on public.order_items;
create policy "customer can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "customer can add own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "customer can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "customer can view own orders" on public.orders for select using (auth.uid() = customer_id);
create policy "customer can add own orders" on public.orders for insert with check (auth.uid() = customer_id);
create policy "customer can view own order items" on public.order_items for select using (exists (select 1 from public.orders where orders.id = order_items.order_id and orders.customer_id = auth.uid()));
create policy "customer can add own order items" on public.order_items for insert with check (exists (select 1 from public.orders where orders.id = order_items.order_id and orders.customer_id = auth.uid()));

-- Admin dashboard policies are role-based; do not hardcode an email in frontend code.
drop policy if exists "owner can manage all orders" on public.orders;
drop policy if exists "owner can view all items" on public.order_items;
drop policy if exists "owner can view customer profiles" on public.profiles;
create policy "admins can manage all orders" on public.orders for all using (public.is_admin()) with check (public.is_admin());
create policy "admins can view all items" on public.order_items for select using (public.is_admin());
create policy "admins can view customer profiles" on public.profiles for select using (public.is_admin());

drop policy if exists "public can view active products" on public.products;
drop policy if exists "admins can manage products" on public.products;
create policy "public can view active products" on public.products for select using (active = true or public.is_admin());
create policy "admins can manage products" on public.products for all using (public.is_admin()) with check (public.is_admin());

-- Run this once after creating/verifying the owner's Supabase account:
-- update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'YOUR-OWNER-EMAIL@example.com');

insert into public.products (name, price, image_url, description) values
  ('Bread', 40, 'images/product-bread.jpg', 'Soft, fresh and baked daily with premium flour.'),
  ('Cakes', 500, 'images/product-cakes.jpg', 'Birthday, anniversary aur custom cakes - always fresh.'),
  ('Puffs', 30, 'images/product-puffs.jpg', 'Crispy, flaky and full of flavour.'),
  ('Cookies', 120, 'images/product-cookies.jpg', 'Crunchy homemade cookies for every mood.'),
  ('Buns & Rolls', 35, 'images/product-buns.jpg', 'Soft and fluffy, perfect for every meal.'),
  ('Snacks', 80, 'images/product-snacks.jpg', 'Tasty evening snacks, made fresh daily.'),
  ('Rusk', 90, 'images/product-rusk.jpg', 'Perfect crunchy companion for your chai.'),
  ('Muffins', 50, 'images/product-muffins.jpg', 'Soft, moist muffins in delicious flavours.'),
  ('Biscuits', 100, 'images/product-biscuits.jpg', 'Crispy, buttery biscuits made the traditional way.')
on conflict (name) do nothing;
