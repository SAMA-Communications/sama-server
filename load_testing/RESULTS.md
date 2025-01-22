# Results of Load Testing for SAMA Server

## Without Clustering (Single Thread)

| Processor                | Cors | Date       | Build Version | Number of Users | Delay per User (sec) | Max % During Loading | Avg % After Loading | Clear testing\* |
| ------------------------ | ---- | ---------- | ------------- | --------------- | -------------------- | -------------------- | ------------------- | --------------- |
| Intel® Xeon® Gold 6140 | 2    | 22.01.2025 | 0.28.0        | 300             | 2.2                  | 77                   | 66                  | ✅              |
| Intel® Xeon® Gold 6140 | 2    | 22.01.2025 | 0.28.0        | 150             | 3                    | 37                   | 36                  | ✅              |
| Intel® Core™ i5-11400H | 6    | 22.01.2025 | 0.28.0        | 300             | 2                    | 27                   | 15                  | ❌              |
| Intel® Core™ i5-11400H | 6    | 22.01.2025 | 0.28.0        | 600             | 1                    | 33                   | 23                  | ❌              |

- **Clear testing** means that the tests were run from another (remote) computer. Otherwise, the computer received additional load from other applications.

## With Clustering

| Processor                | Cors | Date       | Build Version | Number of Users | Delay per User (sec) | Max % During Loading | Avg % After Loading | Clear testing\* |
| ------------------------ | ---- | ---------- | ------------- | --------------- | -------------------- | -------------------- | ------------------- | --------------- |
| Intel® Core™ i5-11400H | 6    | 22.01.2025 | 0.28.0        | 300             | 2                    | 21                   | 13                  | ❌              |
| Intel® Core™ i5-11400H | 6    | 22.01.2025 | 0.28.0        | 600             | 1                    | 31                   | 29                  | ❌              |

- **Clear testing** means that the tests were run from another (remote) computer. Otherwise, the computer received additional load from other applications.
