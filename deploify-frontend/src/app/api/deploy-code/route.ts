// src/app/api/deploy-code/route.ts

import { createClient, commandOptions } from 'redis';
import { NextResponse } from 'next/server';

const subscriber = createClient();
subscriber.connect();

// Handle GET or POST request to start processing the queue
export async function GET(req: Request) {
  try {
    // Listen for tasks in the 'build-queue' Redis list
    while (true) {
      const response = await subscriber.brPop(
        commandOptions({ isolated: true }),
        'build-queue',
        0 // Block indefinitely until a task is available
      );

      // Log the task received
      console.log('Task received:', response);

    }
  } catch (error) {
    console.error('Error in Redis subscriber:', error);
    return NextResponse.json({ error: 'Error processing queue' }, { status: 500 });
  }
}
