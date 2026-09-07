import { Module } from '@nestjs/common';
import { SupabaseRealtime } from './supabase-realtime';

@Module({ providers: [SupabaseRealtime], exports: [SupabaseRealtime] })
export class RealtimeModule {}
