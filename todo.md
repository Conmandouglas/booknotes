MINDSET TO KEEP:
skill comes with time. keep at it, stay organized, and stay focused.
nothing worth showing off ever comes easy.
one year ago: I was at the very start of the course, at papaws, after watching Wonka.

Monday, Dec 2
- I finished up some final freeform drawings and scrapped draw.io
- I set up the project & file structure
- I set up the project in git & github
- I set up the data structure in PG admin
To do tommorow:
- get basic website to show database review data on home page

Tuesday, Dec 3
- Added EJS package, index ejs file, as well as partials
- Updated port in index.js to port 3000
- Added the database initilization in index.js
- Created function that grabs all reviews, puts in array
- Added home "/" route that renders reviews on index.ejs
- Add modify screen
  - title
  - details
  - author
- Add ability to create reviews
- Add ability to edit reviews
- Add preparation for multi-user support 
To do tommorow:
- Add the 1/10 basic rating system to modify page
- Add the date of each post
- Fetch book cover API and show photo to the left of the div
  - use float temporarily before main styling
- Add choose user route & page

Wednesday Dec 4
- Add rating number input box to modify.ejs
- Add rating column to reviews table
- Add "date" posted column to database
- Add date posted to each post upon creation
- Install axios
- Add functioning book cover API that grabs books based on title entered

Thursday Dec 5
- Progress on transferring over to open library covers

Friday Dec 13
- Today, after DAYS of hard work, I finally got the book covers rendering on screen using the open library API
  - it grabs the title, searches API, and adds link to database
  - to prevent further lag, it only does it once. if already a link, it moves on
To do on Sunday:
- Add multi user support
- Add the choose-user route and page
- Add book author support when editing a post

Sunday, Dec 15
- Updated edit to support book author & reviews
- Updated edit to where once it submits, it resets the thunbnail URL and regenerates upon going to home page
- With multi user support, the plan is:
  - No matter what, all posts are showing
  - It will day the name of currently selected user at top of page with "Not you?" section
  - You can only edit a post if it is by you
- Created a new function checkUser() to get the user's name using Id
- Added currentUserId and related to the following locations:
  - app.get("/") - sends in listUser, instead of a hardcoded name it now gets
  data from the newly created checkUser()
  - app.post("/add") - added currentUserId instead of a hardcoded "1"
- When rendering home page, the user's name is now sent in, instead of book author, for "Review by..." paragraph in EJS, for each review.
To do next:
- Fix errors in multi user system, it is not grabbing the username from the array that I made that edited the result. And the user not found for id. Make it so it grabs the name of user. This is the main thing. After this, I am golden to add more user-related features.



TODO (in order):
- Update project to include multi-user support
- Add choose-user route and page
- Add ability to delete reviews
- Only allow user to delete review if they wrote it
- Add a confirmation diologue before deleting a review
- Add ability filter:
  - All reviews
  - Only ones that user has posted
- Override the auto thumbnail and add a way for user to upload custom photo for book using URL or ISBN code and it grabs it and updates it in database
- Test & make sure project works up to this point
- Start doing some basic styling, and decide whether it will be worth it
  to do bootstrap
- Add a light/dark toggle in a corner
- Find a way to add an arrow that pops up to scroll back up to the top
- Add some sort of basic auth system, username and password for each user and creation
  - semi secure
- Pat myself on the back for accomplishing this task of a project, my FINAL
capstone is now complete. But the journey doesn't end here.