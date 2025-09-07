import { DataSource } from 'typeorm';
import { AuthSeeder } from './auth.seeder';
import { ProjectSeeder } from './project.seeder';
import { dataSourceConfig } from '../../config/database.config';

async function runSeeds() {
  const dataSource = new DataSource(dataSourceConfig);
  
  try {
    await dataSource.initialize();
    console.log('Database connected successfully');

    // Run auth seeder first
    console.log('Running auth seeder...');
    const authSeeder = new AuthSeeder(dataSource);
    await authSeeder.run();

    // Run project seeder
    console.log('Running project seeder...');
    const projectSeeder = new ProjectSeeder(dataSource);
    await projectSeeder.run();

    console.log('All seeds completed successfully');
    console.log('\n=== SEED DATA SUMMARY ===');
    console.log('Admin User:');
    console.log('  Username: admin');
    console.log('  Password: admin@2025');
    console.log('  Email: admin@kanban.com');
    console.log('\nProject Owner:');
    console.log('  Username: owner');
    console.log('  Password: owner@2025');
    console.log('  Email: owner@kanban.com');
    console.log('\nTeam Member 1:');
    console.log('  Username: member1');
    console.log('  Password: member1@2025');
    console.log('  Email: member1@kanban.com');
    console.log('  Full Name: John Developer');
    console.log('\nTeam Member 2:');
    console.log('  Username: member2');
    console.log('  Password: member2@2025');
    console.log('  Email: member2@kanban.com');
    console.log('  Full Name: Jane Designer');
    console.log('\nProject: Sample Kanban Project');
    console.log('Board: Main Board with 4 columns');
    console.log('Tasks: 8 sample tasks with assignments');
    console.log('Members: 4 total (owner, admin, member1, member2)');
    console.log('========================');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

runSeeds();
