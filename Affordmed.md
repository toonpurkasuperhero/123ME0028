# Submission Guidelines

* Create a **Public** Repository on your Github Account with your **Roll Number** as the **Repository Name**

* For Full Stack track, create the following inside the repository

  * `logging_middleware` folder
  * `notification_system_design.md` (as markdown file)
  * `notification_app_be` folder
  * `notification_app_fe` folder
  * `.gitignore` (add node_modules if js/ts is used)

* For Backend track, create the following inside the repository

  * `logging_middleware` folder
  * `vehicle_maintence_scheduler` folder
  * `notification_system_design.md` (as markdown file)
  * `notification_app_be` folder
  * `.gitignore` (add node_modules if js/ts is used)

* For Frontend tracks, create the following inside the repository

  * `logging_middleware` folder
  * `notification_system_design.md` (as markdown file)
  * `notification_app_be` folder
  * `notification_app_fe` folder
  * `.gitignore` (add node_modules if js/ts is used)

* Ensure that your **Name**, or any mention of **Affordmed**, is entirely absent from the **Repository Name**, the README file, and all commit messages.

* For each question, submit comprehensive solutions. This includes your architecture design, complete code and clear output screenshots. Incomplete submissions will not be considered for evaluation.

* We strongly encourage you to commit and push your code to GitHub regularly, at logical milestones in your development process.

* Please adhere to production-grade coding standards. This includes employing proper naming conventions, maintaining a well-organised folder structure, and providing appropriate comments within your code to enhance readability. This is only an indicative list and you are encouraged to demonstrate other best practices that you are aware of.

* For **Backend Track** or the Backend question of **Full Stack Track**, select any Backend Framework without utilising external libraries for algorithms. Capture output screenshots from API clients like Insomnia or Postman, displaying request body, response and response time for the problem. The output screenshots have to be taken of API calls to your app and not the test server

* For **Frontend Track** or the Frontend question of Full Stack Track, it is mandatory to use **React** or **Next**. While **JavaScript** is permitted, the use of **TypeScript** is preferred. Capture output screenshots of both mobile and desktop views of your web application. For styling, only **Material UI** or **Vanilla CSS** are permitted.

* Any instance of plagiarism, including using another applicant's API credentials, LLMs will lead to immediate rejection.

---

# Registration

You need to register with our Test Server to obtain your unique **Client ID** and **Client Secret**.

## Requirements:

* Your **Roll Number** and **Email**, must align with your university/college email and roll number. (Email must support Google Form verified submission)

* The **GitHub Repository link** you submit in the **Google Form** will be matched against the **GitHub Username** provided during registration. Any mismatch will result in your submission being ignored. If your GitHub Profile link is `https://github.com/username`, submit only `username` while Registering.

* The **accessCode** required for registration has been shared via the email you received. Do not use the example **accessCode** provided below.

---

# Registration API (POST)

```txt
http://4.224.186.213/evaluation-service/register
```

## Request Body

```json
{
    "email": "ramkrishna@abc.edu",
    "name": "Ram Krishna",
    "mobileNo":"9999999999",
    "githubUsername": "github",
    "rollNo": "aa1bb",
    "accessCode": "xgAsNC"
}
```

## Response

You can register only once. Do not forget to save your `clientID` and `clientSecret`; you cannot retrieve them again.

```json
{
    "email": "ramkrishna@abc.edu",
    "name": "ram krishna",
    "rollNo": "aa1bb",
    "accessCode": "xgAsNC",
    "clientID": "d9cbb699-6a27-44a5-8d59-8b1befa816da",
    "clientSecret": "tVJaaaRBSeXcRXeM"
}
```

---

# Authentication

After successful registration, you must obtain an Authorization Token to access the Test Server APIs.

## Authorization Token API (POST)

```txt
http://4.224.186.213/evaluation-service/auth
```

## Request Body

```json
{
    "email": "ramkrishna@abc.edu",
    "name": "ram krishna",
    "rollNo": "aa1bb",
    "accessCode": "xgAsNC",
    "clientID": "d9cbb699-6a27-44a5-8d59-8b1befa816da",
    "clientSecret": "tVJaaaRBSeXcRXeM"
}
```

## Response (Status Code: 200)

```json
{
    "token_type": "Bearer",
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQzNTc0MzQ0LCJpYXQiOjE3NDM1NzcyI6IkFmZm9yZG1lZCIsImp0aSI6ImP0aSI6ImQ5Y2JjNjk5LTZhMjctNDRhNS04ZDU5LThiMWJ1ZmE4MTZkYSIsInN1YiI6InJhbWt1aXNoYmFYWJjLmVkdSIsIm5hbWUiOiJyYW9ga3Jpc2huYSIsInJvbGxObyI6ImFhMWJ1IiwiYWNjZXNzQ29kZSI6InhhQXN0Q0QyIsImNsawVudElEIjoiZDljYmI2OTktNmEyNy00NGE1LThkNTktOGIxYmVmYTgxNmRhIiwic2xpZW50U2VjcmV0IjoidFZKVWhUJTZVhjU1h1TSJ9.YApD98gq0IN_OWw7JMfmuUfK1m4hlTm7AIcLDcLAzVg",
    "expires_in": 1743574344
}
```

---

# Develop Logging Middleware

The 'Logging Middleware' is a critical component for building robust and observable applications. While error logging is essential, we expect you to implement logging that captures the entire lifecycle of significant events within your application – from successful operations to warnings, informational messages, and debugging details. Think of logs as the narrative of your application's execution! These logs are crucial for understanding application behavior, performance, and for effective debugging.

Note: While you have flexibility in choosing your backend language/framework, the Logging Middleware must be a reusable package. If attempting the Full Stack track, both this middleware and your backend application must be developed in **TypeScript/JavaScript** to enable the logging package's consumption by the **Frontend**.

Write a reusable function that makes an API call to the Test Server each time the function is called that matches the below structure:

```txt
Log(stack,level,package,message)
```

Integrate this reusable Log function strategically throughout your codebase. Each Log call should provide specific and descriptive context about what's happening. Instead of generic messages, aim for logs that clearly communicate the state, actions, and any relevant data at that point in the code.

We encourage you to think critically about what information would be most valuable if you were to troubleshoot your application months from now. That's the information you should be logging!

### Example

```js
// If an error occurs in your application's handler due to a data type mismatch
Log("backend", "error", "handler", "received string, expected bool")

// If an error occurs in your application's db layer
Log("backend", "fatal", "db", "Critical database connection failure.")
```

---

# The test server has the below API that you can call in your Logging Middleware

## Log API (POST)

```txt
http://4.224.186.213/evaluation-service/logs
```

---

# Constraints

* API is a protected Route
* Stack, Level and Package Fields accept only the following values (in lower case only)

---

# Stack

```txt
"backend"
"frontend"
```

# Level

```txt
"debug"
"info"
"warn"
"error"
"fatal"
```

# Package

### Packages that can only be used in Backend Application

```txt
"cache"
"controller"
"cron_job"
"db"
"domain"
"handler"
"repository"
"route"
"service"
```

### Packages that can be only used in Frontend Application

```txt
"api"
"component"
"hook"
"page"
"state"
"style"
```

### Packages that can be used in both Backend and Frontend Application

```txt
"auth"
"config"
"middleware"
"utils"
```

---

# Request Body

```json
{
    "stack":"backend",
    "level":"error",
    "package":"handler",
    "message":"received string, expected bool"
}
```

# Response (Status Code: 200)

```json
{
    "logID": "a4aad02e-19d0-4153-86d9-58bf55d7c402",
    "message": "log created successfully"
}


The above given part is the Pre Test Part. We have to do this prior to starting the project.

# Campus Hiring Evaluation - Backend

# Terms & Conditions

This document and the associated assessment contain confidential and proprietary information of Afford Medical Technologies Private Limited (hereinafter **"Affordmed"**). By accessing this material or participating in this assessment, you acknowledge receipt of this information for the sole purpose of evaluating your candidacy for an internship, contract, or employment with Affordmed. You hereby agree to the following:

* **Confidentiality:** You shall maintain the strict confidentiality of all information received and refrain from sharing, distributing, or disclosing any part of the information to any third party.

* **Non-Tampering:** You shall not tamper with, disrupt, or attempt to compromise any Affordmed or its vendor’s cloud or software resources provided for this assessment.

* **Sole Use:** You shall use this material solely for the purpose stated herein and for no other purpose whatsoever.

Any unauthorised use, disclosure, or tampering will result in immediate disqualification from the candidacy process and may subject you to legal action. You consent to the exclusive jurisdiction of the Courts of Hyderabad/Secunderabad for any legal disputes arising from this agreement. Any reference to third parties within this document is purely coincidental and for illustrative purposes only, and does not constitute any endorsement or affiliation.

---

# Evaluation Considerations

**Time Limit:** 3 Hours (No extra time for pushing to GitHub)

* It is essential to complete all the steps listed in the Pre-Test Setup document prior to working on the below test.

* **Mandatory Logging Integration:** Wherever you’re tasked with writing code, your implementation **MUST** extensively use the Logging Middleware you created in the Pre-Test Setup stage. Use of inbuilt language loggers or console logging is not allowed.

* **Authentication:** For the purpose of this evaluation, assume users accessing your application/code/APIs as having been pre-authorised. Your application must not require user registration or login mechanisms for access.

---

# Vehicle Maintenance Scheduler Microservice

You’ve joined a team responsible for planning daily vehicle maintenance at a logistics company.

Each depot handles many service requests every day - from quick fixes to longer repairs. Every request (or task) comes with two key details: how long it will take (in hours) and a score that represents how important it is to complete that task soon. The importance score is based on how much the vehicle contributes to operations. For example, a vehicle running frequent delivery routes or handling busy areas may have a higher score compared to a rarely used backup vehicle. So, choosing the right set of tasks directly affects overall efficiency.

However, there’s a strict limit on how many mechanic-hours are available each day. This means you cannot complete all tasks and must carefully decide which ones to include. The challenge is to pick a combination of tasks such that:

* The total time spent does not exceed the available mechanic-hours
* The total importance score is as high as possible

Since the number of tasks can be very large, the solution should be efficient enough to handle real-world scale inputs.

Given a list of vehicles requiring maintenance, each with an operational impact score and estimated service duration, and a daily mechanic-hour budget, determine the subset of vehicles to service to maximise the total operational impact score within the available budget. Submit your code along with output screenshots to the “vehicle_scheduling” folder in the GitHub Repository you created while building the logging_middleware.

You’re provided with the below APIs. You are expected to use these APIs to fetch the depot and task details. You need not store them in a database, nor are you supposed to hard-code or create them yourself.

---

# Depot API (GET)

```txt id="7s4qvo"
http://4.224.186.213/evaluation-service/depots
```

## Constraints

* API is a protected Route

## Response (Status Code: 200)

```json id="99u9zw"
{
    "depots": [
        {
            "ID": 1,
            "MechanicHours": 60
        },
        {
            "ID": 2,
            "MechanicHours": 135
        },
        {
            "ID": 3,
            "MechanicHours": 188
        },
        {
            "ID": 4,
            "MechanicHours": 97
        },
        {
            "ID": 5,
            "MechanicHours": 164
        }
    ]
}
```

---

# Vehicles API (GET)

```txt id="ep0i1r"
http://4.224.186.213/evaluation-service/vehicles
```

## Constraints

* API is a protected Route

## Response (Status Code: 200)

```json id="1ojvuy"
{
    "vehicles": [
        {
            "TaskID": "264e638f-1c7a-4d67-9f9c-53f3d1766d37",
            "Duration": 1,
            "Impact": 5
        },
        {
            "TaskID": "73ce9dca-1536-4a7a-9f1e-c67083afad61",
            "Duration": 6,
            "Impact": 2
        },
        {
            "TaskID": "4b6e22ee-b4ed-45a4-a6af-5294b0d69f37",
            "Duration": 1,
            "Impact": 3
        },
        {
            "TaskID": "d6372f32-852b-46a9-8e8c-e730fecc3c22",
            "Duration": 5,
            "Impact": 5
        },
        {
            "TaskID": "ec40b581-bdfc-43e0-a047-871fdafe8167",
            "Duration": 7,
            "Impact": 3
        },
        {
            "TaskID": "fb1e3165-67c9-4e96-a5c3-2d20085d293b",
            "Duration": 6,
            "Impact": 3
        },
        {
            "TaskID": "330065c0-3815-4e10-a18a-b93b117e30a8",
            "Duration": 5,
            "Impact": 1
        },
        {
            "TaskID": "72a91abc-4ed7-492c-9e99-348e7437953b",
            "Duration": 5,
            "Impact": 9
        },
        {
            "TaskID": "8a7ff5b1-335c-4a2f-96d8-09c4a362e781",
            "Duration": 6,
            "Impact": 10
        },
        {
            "TaskID": "08d00114-9506-463d-ba2e-3343ec4e2e89",
            "Duration": 6,
            "Impact": 6
        },
        {
            "TaskID": "a1e0b8e6-1076-4a2f-b83b-5e6017900033",
            "Duration": 6,
            "Impact": 1
        },
        {
            "TaskID": "52635341-7c5f-475a-9839-4676f8fe5fd4",
            "Duration": 1,
            "Impact": 5
        },
        {
            "TaskID": "9e08defa-7bb5-4a83-9e29-417165922894",
            "Duration": 6,
            "Impact": 9
        },
        {
            "TaskID": "f92b0f39-35ec-47c3-a465-3e49c22185b6",
            "Duration": 2,
            "Impact": 5
        },
        {
            "TaskID": "65c0d74a-82ef-4fcc-9d85-9b082bb85310",
            "Duration": 5,
            "Impact": 7
        },
        {
            "TaskID": "68ee2f8d-4145-4472-bce9-1d0968a8092a",
            "Duration": 1,
            "Impact": 1
        },
        {
            "TaskID": "8a294532-c7ee-4e19-803d-f98b7e73e8bc",
            "Duration": 8,
            "Impact": 7
        },
        {
            "TaskID": "18c655b2-380d-4295-8905-863f0de32c8f",
            "Duration": 2,
            "Impact": 9
        },
        {
            "TaskID": "436e87a6-2b5b-42b9-9c35-deaa2c8ef54e",
            "Duration": 2,
            "Impact": 3
        },
        {
            "TaskID": "0a823f1b-03c3-4722-af40-e17a7b9ee0ff",
            "Duration": 2,
            "Impact": 5
        },
        {
            "TaskID": "0bf780cb-1099-4f61-99bf-dec95a7063b6",
            "Duration": 3,
            "Impact": 10
        },
        {
            "TaskID": "e716fb11-1064-4db7-9d76-06d19f4f6f67",
            "Duration": 5,
            "Impact": 5
        },
        {
            "TaskID": "60586e47-ab9c-407d-85ca-1215084f3f41",
            "Duration": 8,
            "Impact": 8
        },
        {
            "TaskID": "08635e52-dad5-4b78-8ab1-e55db53c0c18",
            "Duration": 8,
            "Impact": 5
        },
        {
            "TaskID": "871ddcf5-0bba-4233-bf12-c776c496e314",
            "Duration": 7,
            "Impact": 10
        },
        {
            "TaskID": "b57f17dc-db77-42bf-a7e9-8fec596ce498",
            "Duration": 7,
            "Impact": 1
        },
        {
            "TaskID": "1d893de7-fbba-4c77-927b-e3076fe805d5",
            "Duration": 1,
            "Impact": 8
        },
        {
            "TaskID": "1743e1b5-9dfd-450b-9905-98c3e054aee1",
            "Duration": 5,
            "Impact": 8
        },
        {
            "TaskID": "48851915-eaf5-48ec-a20c-5074d7050c5f",
            "Duration": 8,
            "Impact": 8
        },
        {
            "TaskID": "7d81e6ca-8f03-4c4a-9ec0-701f820c5655",
            "Duration": 7,
            "Impact": 8
        }
    ]
}
```

# Campus Notifications Microservice

# Deliverables

* You’re a backend developer working on a campus notification platform where students receive real-time updates regarding Placements, Events, and Results. You have to incrementally solve different tasks across stages. Not every stage requires coding, each stage has clear instructions on the deliverables. You're expected to commit and push your deliverables to the same GitHub Repository that you created while implementing the Logging Middleware at frequent intervals. Direct submission of your response at the end of the test as a single commit will result in lower points for your submission.

* As you progress through the stages, you may revise your submission for the previous stages. Your submission will be evaluated across stages both individually and cumulatively.

* At different stages, there may be references to others roles within the team and those are provided only as an indication of the role that they shall play. At no point should you consult or discuss your strategy or submissions with your peers.

---

# Stage 1

Assume a front-end developer colleague has asked you for REST API design, contract and structure to display notifications to the users when they are logged in. Identify the core actions that the notification platform should support. Now, you have to present the REST API endpoints along with their JSON request, response, and headers structures using an appropriate format.

Define clear and consistent endpoints for each action, using predictable naming conventions, and design JSON schemas with essential fields. Also, you are to design a mechanism for real-time notifications.

Submit your response as a markdown file called “notification_system_design.md” to the same repository you created while creating the logging middleware. Label your response with “Stage 1” as heading.

---

# Stage 2

On the basis of the APIs and contract you created earlier, you now have to store the same reliably. Which persistent storage (DB) do you suggest and explain your choice. Write the applicable DB schema. What problems could arise as the data volume increases? How would you solve such problems? Write SQL or NoSQL queries based on your DB schema and the REST APIs that you designed in Stage 1.

Submit your response in a new section labeled “Stage 2” by expanding the same “Notification_System_Design.md” file.

---

# Stage 3

An earlier developer in the team chose a relational database for storage (MySQL or PostgreSQL) about 3 months ago. Now the database has grown to 50,000 students and 5,000,000 notifications. The developer had written the below query to fetch all the unread notifications of a student as a part of the notification API that was developed, which is now performing slowly.

```sql id="8r2h3u"
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt DESC;
```

Is this query accurate? Why is this slow? What would you change and what would be the likely computation cost? Another developer on your team suggests adding indexes on every column to be safe. Is this advice effective? Why/Why not?

Write a query to find all students who got a placement notification in the last 7 days. The table contains “notificationType” as a column which accepts “notification_type” enum values. “notification_type” enum contains "Event", "Result" and "Placement".

Submit your response in a new section labeled “Stage 3” by expanding the same “notification_system_design.md” file.

---

# Stage 4

The notifications are being fetched on each page load for every student. The DB is getting overwhelmed which is causing a bad user experience. What solution will you suggest? How will you improve performance? Elaborate on the tradeoffs of each strategy you suggest.

Submit your response in a new section labeled “Stage 4” by expanding the same “Notification_System_Design.md” file.

---

# Stage 5

It is placement season. The HR clicks on “Notify All” and 50,000 students should get an email and an in-app notification simultaneously. Below is pseudocode for the proposed implementation.

```python id="2bhz1q"
function notify_all(student_ids: array, message: string):
    for student_id in student_ids:
        send_email(student_id, message)  # calls Email API
        save_to_db(student_id, message)  # DB insert
        push_to_app(student_id, message) # implementation is based on whatever real time notification mechanism you have chosen in Stage 1
```

What shortcomings do you observe with this implementation? Logs indicate that the `send_email` call failed for 200 students midway. What now? How would you redesign this to be reliable and fast? Should the process of saving to DB as well as sending the email happen together? Why or why not?

Submit revised pseudocode along with your response to these questions in a new section labeled “Stage 5” by expanding the same “Notification_System_Design.md” file.

---

# Stage 6

You’ve received user feedback from your product manager, they’d like to introduce a Priority Inbox that always displays the top ‘n’ most important unread notifications first (n could be top 10,15, 20, etc. as per user’s choice). Priority should be determined based on a combination of weight (placements > result > event) and recency.

Implement your approach or solution in any language of your choice (Go, Rust, Python, TypeScript, JavaScript, Java etc). Write code only to find top 10 notifications (DB query is not expected). Your submission should be an actual functioning code file and not pseudo-code. You’re also expected to upload screenshots of your output displaying the priority notifications. Both the code and the screenshots are to be pushed to the same GitHub repository. Also note that new notifications will keep coming in. How will you maintain the top 10 efficiently? In addition to the code and screenshots, you may revise the same “notification_system_design.md” file to also explain your approach in this stage in a new section labeled “Stage 6”.

To simplify your task, you’re also provided with the below Notification API. You are expected to use the API to fetch the notifications. You need not store them in a database, nor are you supposed to hard-code or create notifications yourself.

---

# Notification API (GET)

```txt id="9m8s2n"
http://4.224.186.213/evaluation-service/notifications
```

## Constraints

* API is a protected Route

## Response (Status Code: 200)

```json id="3h1w9v"
{
    "notifications": [
        {
            "ID": "d146095a-0d86-4a34-9e69-3900a14576bc",
            "Type": "Result",
            "Message": "mid-sem",
            "Timestamp": "2026-04-22 17:51:30"
        },
        {
            "ID": "b283218f-ea5a-4b7c-93a9-1f2f240d64b0",
            "Type": "Placement",
            "Message": "CSX Corporation hiring",
            "Timestamp": "2026-04-22 17:51:18"
        },
        {
            "ID": "81589ada-0ad3-4f77-9554-f52fb558e09d",
            "Type": "Event",
            "Message": "farewell",
            "Timestamp": "2026-04-22 17:51:06"
        },
        {
            "ID": "0005513a-142b-4bbc-8678-eefec65e1ede",
            "Type": "Result",
            "Message": "mid-sem",
            "Timestamp": "2026-04-22 17:50:54"
        },
        {
            "ID": "ea836726-c25e-4f21-a72f-544a6af8a37f",
            "Type": "Result",
            "Message": "project-review",
            "Timestamp": "2026-04-22 17:50:42"
        },
        {
            "ID": "003cb427-8fc6-4f7f-bb00-be228f6b0d2c",
            "Type": "Result",
            "Message": "external",
            "Timestamp": "2026-04-22 17:50:30"
        },
        {
            "ID": "e5c4ff20-31bf-4d40-8f02-72fda59e8918",
            "Type": "Result",
            "Message": "project-review",
            "Timestamp": "2026-04-22 17:50:18"
        },
        {
            "ID": "1cfce5ee-ad37-4894-8946-d707627176a5",
            "Type": "Event",
            "Message": "tech-fest",
            "Timestamp": "2026-04-22 17:50:06"
        },
        {
            "ID": "cf2885a6-45ac-4ba0-b548-6e9e9d4c52c8",
            "Type": "Result",
            "Message": "project-review",
            "Timestamp": "2026-04-22 17:49:54"
        },
        {
            "ID": "8a7412bd-6065-4d09-8501-a37f11cc848b",
            "Type": "Placement",
            "Message": "Advanced Micro Devices Inc. hiring",
            "Timestamp": "2026-04-22 17:49:42"
        }
    ]
}
```

