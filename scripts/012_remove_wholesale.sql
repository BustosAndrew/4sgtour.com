-- Remove wholesale user type and pricing

-- Update user_type constraint to only allow 'regular' and 'admin'
alter table profiles 
drop constraint if exists profiles_user_type_check;

alter table profiles 
add constraint profiles_user_type_check 
check (user_type in ('regular', 'admin'));

-- Update any existing wholesale users to regular
update profiles 
set user_type = 'regular' 
where user_type = 'wholesale';

-- Drop the price_wholesale column from trips table
alter table trips 
drop column if exists price_wholesale;
