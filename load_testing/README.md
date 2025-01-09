# JMeter Load Testing for SAMA Server

## Prerequisites

1. **Install JMeter**: Ensure JMeter is installed and the `bin` directory is accessible in your system PATH.
2. **Required Plugin**: Install the following JMeter plugin locally:
   - WebSocket Sampler

Useful installation link for Mac users: [How to Install Apache JMeter on macOS](https://tejaksha-k.medium.com/a-step-by-step-guide-how-to-install-apache-jmeter-on-macos-6a9eb8bf3463)

## Test Structure

The test plan is stored in a `.jmx` file, which defines the load test scenario.

### Key Test Case Details:

1. Each thread creates one user.
2. The user whose sequence number is a multiple of 4 creates a group chat with the previous three users.
3. Each user continuously sends messages to the chat with a delay of 1.5 seconds.

### Load Configuration:

- **Number of Threads**: This is the total number of simulated users.
  - Each thread represents one user.
- **Ramp-up Time**: The delay between the start of each thread.
- **Group Size**: In the JSR223 Sampler, the `groupSize` variable determines the number of users in a single chat group.
  - Number of chats = Math.floor( number of users / groupSize )

## Running the Tests

Run the Test via Console:

1. **Prepare the Result Directory**:

   - Create a folder named `result` in your desired output location.
   - Clear this folder before each test run.

2. **Run the command to start**:
   Execute the following command from the JMeter `bin` directory with administrator privileges:
   ```
   jmeter.bat -n -t "path_to_load_test.jmx" -l "path_to_result.jtl" -e -o "desired_output_location"
   ```
   - `-t`: Path to the `.jmx` test plan file.
   - `-l`: Path to save the result log file. (Not mandatory to review.)
   - `-o`: Path to save the HTML report. Note: The report will not generate if you stop the test using `Ctrl + C`.

In addition, you can always run tests inside the JMeter application.

## Notes

- Monitor system load during the test.
  - Example: For 1000 users, CPU usage may peak at 80+% during users creation but stabilize to 45-60% during message sending.
- Use larger user numbers cautiously, keeping an eye on CPU and memory usage.
- Increase ramp-up time if threads are starting too quickly.
