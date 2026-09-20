begin;

select plan(1);
select pass('Supabase database test runner is available');

select * from finish();
rollback;
