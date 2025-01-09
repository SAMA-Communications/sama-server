# JMeter Load Testing for SAMA Server

## Prerequisites

1. **Install JMeter**: Ensure JMeter is installed and the `bin` directory is accessible in your system PATH.
2. **Required Plugin**: Install the following JMeter plugin locally:
   - WebSocket Sampler
3. **Java Version**: To run the tests, ensure that you are using Java version 20 or lower.
   - All tests were performed using Java 17.

Useful installation link for Mac users: [How to Install Apache JMeter on macOS](https://tejaksha-k.medium.com/a-step-by-step-guide-how-to-install-apache-jmeter-on-macos-6a9eb8bf3463)

## Test Structure

The test plan is stored in a `.jmx` file, which defines the load test scenario.

### Key Test Case Details:

1. Each thread creates one user.
2. The user whose sequence number is a multiple of 4 creates a group chat with the previous three users.
3. Each user continuously sends messages to the chat with a delay of 5 seconds.

### Load Configuration:

- **Number of Threads**: This is the total number of simulated users.
  - Each thread represents one user.
- **Ramp-up Time**: The total time for starting all threads.
  - To adjust the user creation frequency, use the formula: (Ramp-up Time) ÷ (Number of Threads) = Delay between user creation.
- **Group Size**: In the Test Plan, the `GROUP_SIZE` variable determines the number of users in a single chat group.
  - Number of chats = Math.floor(Number of Users / GROUP_SIZE)

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

## Test Termination Conditions

The test will terminate if the CPU load exceeds 70% for the last 15 minutes. You can also modify these values according to your needs:

- CPU Load Threshold: `Test Plan -> CPU_THRESHOLD = your value (70 by default)`
- Time Period for CPU `Load: Test Plan -> TIMEOUT_MINUTES = your value in minutes (15 by default)`

## Notes

- Use larger user numbers cautiously, keeping an eye on CPU and memory usage.
- Increase ramp-up time if threads are starting too quickly.
