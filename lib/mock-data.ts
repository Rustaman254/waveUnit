import { supabase } from './supabase';

export async function generateMockTransparencyReports() {
  const mockReports = [
    {
      week_start_date: '2025-10-13',
      total_hens: 500,
      eggs_produced: 3150,
      revenue_ksh: 63000,
      operating_costs_ksh: 28500,
      feed_cost_ksh: 18000,
      labor_cost_ksh: 8000,
      other_costs_ksh: 2500,
      net_profit_ksh: 34500,
      notes: 'Excellent production week. All hens healthy and laying consistently.',
      published_at: new Date('2025-10-20').toISOString(),
    },
    {
      week_start_date: '2025-10-06',
      total_hens: 495,
      eggs_produced: 3100,
      revenue_ksh: 62000,
      operating_costs_ksh: 27800,
      feed_cost_ksh: 17500,
      labor_cost_ksh: 8000,
      other_costs_ksh: 2300,
      net_profit_ksh: 34200,
      notes: 'Added 5 new hens to the flock. Veterinary checkup completed.',
      published_at: new Date('2025-10-13').toISOString(),
    },
    {
      week_start_date: '2025-09-29',
      total_hens: 490,
      eggs_produced: 3045,
      revenue_ksh: 60900,
      operating_costs_ksh: 27200,
      feed_cost_ksh: 17200,
      labor_cost_ksh: 8000,
      other_costs_ksh: 2000,
      net_profit_ksh: 33700,
      notes: 'Upgraded feeding system for improved efficiency.',
      published_at: new Date('2025-10-06').toISOString(),
    },
    {
      week_start_date: '2025-09-22',
      total_hens: 490,
      eggs_produced: 3038,
      revenue_ksh: 60760,
      operating_costs_ksh: 27500,
      feed_cost_ksh: 17500,
      labor_cost_ksh: 8000,
      other_costs_ksh: 2000,
      net_profit_ksh: 33260,
      notes: 'Normal operations. Weather conditions optimal.',
      published_at: new Date('2025-09-29').toISOString(),
    },
  ];

  try {
    for (const report of mockReports) {
      const { error } = await supabase
        .from('transparency_reports')
        .upsert(report, {
          onConflict: 'week_start_date',
          ignoreDuplicates: false,
        });

      if (error) {
        console.error('Error inserting report:', error);
      }
    }
    console.log('Mock transparency reports created successfully');
  } catch (error) {
    console.error('Error generating mock data:', error);
  }
}
