-- PicStore DB Schema for Supabase

-- 프로필 테이블 (auth.users 확장)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text not null default '',
  role text not null default 'buyer' check (role in ('buyer', 'artist', 'admin')),
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "누구나 프로필 조회 가능" on public.profiles
  for select using (true);

create policy "본인 프로필 수정" on public.profiles
  for update using (auth.uid() = id);

-- 신규 유저 가입 시 프로필 자동 생성 트리거
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 작품 테이블
create table public.works (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  price integer not null default 0, -- 0이면 무료, 단위: 원
  is_free boolean generated always as (price = 0) stored,
  image_url text not null,
  thumbnail_url text,
  artist_id uuid references public.profiles(id) on delete cascade not null,
  download_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.works enable row level security;

create policy "누구나 작품 조회 가능" on public.works
  for select using (true);

create policy "작가 본인 작품 등록" on public.works
  for insert with check (auth.uid() = artist_id);

create policy "작가 본인 작품 수정" on public.works
  for update using (auth.uid() = artist_id);

create policy "작가 본인 작품 삭제" on public.works
  for delete using (auth.uid() = artist_id);

-- 구매 테이블
create table public.purchases (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  work_id uuid references public.works(id) on delete cascade not null,
  amount integer not null,
  status text not null default 'completed' check (status in ('pending', 'completed', 'refunded')),
  created_at timestamptz not null default now(),
  unique(user_id, work_id)
);

alter table public.purchases enable row level security;

create policy "본인 구매내역 조회" on public.purchases
  for select using (auth.uid() = user_id);

create policy "구매 생성" on public.purchases
  for insert with check (auth.uid() = user_id);

-- 다운로드 테이블
create table public.downloads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  work_id uuid references public.works(id) on delete cascade not null,
  created_at timestamptz not null default now()
);

alter table public.downloads enable row level security;

create policy "본인 다운로드 내역 조회" on public.downloads
  for select using (auth.uid() = user_id);

create policy "다운로드 기록 생성" on public.downloads
  for insert with check (auth.uid() = user_id);

-- 좋아요 테이블
create table public.likes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  work_id uuid references public.works(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique(user_id, work_id)
);

alter table public.likes enable row level security;

create policy "누구나 좋아요 수 조회" on public.likes
  for select using (true);

create policy "본인 좋아요 추가" on public.likes
  for insert with check (auth.uid() = user_id);

create policy "본인 좋아요 취소" on public.likes
  for delete using (auth.uid() = user_id);

-- 댓글 테이블
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  work_id uuid references public.works(id) on delete cascade not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

create policy "누구나 댓글 조회" on public.comments
  for select using (true);

create policy "로그인 유저 댓글 작성" on public.comments
  for insert with check (auth.uid() = user_id);

create policy "본인 댓글 삭제" on public.comments
  for delete using (auth.uid() = user_id);

-- 팔로우 테이블
create table public.follows (
  id uuid default gen_random_uuid() primary key,
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique(follower_id, following_id)
);

alter table public.follows enable row level security;

create policy "누구나 팔로우 조회" on public.follows
  for select using (true);

create policy "본인 팔로우 추가" on public.follows
  for insert with check (auth.uid() = follower_id);

create policy "본인 팔로우 취소" on public.follows
  for delete using (auth.uid() = follower_id);

-- 인덱스
create index idx_works_artist_id on public.works(artist_id);
create index idx_works_created_at on public.works(created_at desc);
create index idx_likes_work_id on public.likes(work_id);
create index idx_comments_work_id on public.comments(work_id);
create index idx_follows_following_id on public.follows(following_id);

-- Storage 버킷 생성
insert into storage.buckets (id, name, public) values ('works', 'works', true);

-- Storage 정책
create policy "누구나 이미지 조회" on storage.objects
  for select using (bucket_id = 'works');

create policy "로그인 유저 이미지 업로드" on storage.objects
  for insert with check (bucket_id = 'works' and auth.role() = 'authenticated');

create policy "본인 이미지 삭제" on storage.objects
  for delete using (bucket_id = 'works' and auth.uid()::text = (storage.foldername(name))[1]);
