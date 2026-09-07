import { Module } from '@nestjs/common';
import { SupabaseRest } from './supabase-rest';

@Module({ providers: [SupabaseRest], exports: [SupabaseRest] })
export class PersistenceModule {}
