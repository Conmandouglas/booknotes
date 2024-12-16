//imports required packages
import {} from 'dotenv/config';
import express from 'express';
import pg from 'pg';
import axios from 'axios'

//setup express server
const app = express();
const portRoute = 3000;

//set up database connection
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "bookreviews", 
  password: "ConnorD:0124",
  port: 5432,
});

//connects to the database
const dbConnected = await db.connect().then(()=>true).catch(err => console.log(err));

//checks if connected, and if so continue running
app.listen(portRoute, () => {
  if(!dbConnected) {
    return console.log(`The application could not be started because the database is either offline or the connection information provided is invalid. Check the logs for details.`)
  }
  console.log(`App is running on ${portRoute}`);
});

//sets up express's body parser and sets the public folder for all static files (img, css, etc.)
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(express.static("public"));

//defined variables for use
//var will be dynamic in the future
let currentUserId = 1;

//defined function that queries database for review columns (title, details, id, etc,) and the user's name
//aliases names such as reviews as r, users as u, & username as author
//then, for each review in the result, it defines a variable username, and sends in the userId from the result
//to the checkUser function
async function checkReviews() {
  const checkReviewQuery = `
    SELECT r.id, r.title, r.details, r.rating, r.date, r.book_auth, r.userid, r.thumb, u.name AS author 
    FROM reviews r 
    JOIN users u ON r.userid = u.id 
    ORDER BY r.id DESC;
  `;
  const result = await db.query(checkReviewQuery);

  console.log(result.rows);
  for (const review of result.rows) {
    console.log(`Checked review. review.userId: ${review.userid}`);
    const username = await checkUser(review.userid);
    review.username = username;
    console.log(`Checked review. username: ${username}`);
  }

  return result.rows;
} //end of checkReviews()

//defined function that checks the inputted user id in the users table in the database
//it then selects the name where the id is equal to, but if it does not detect one for the id
//proper error handlins is in place, then it sets var name to the first row of result, and
//it gets returned
async function checkUser(inp) {
  const checkUserQuery = `
    SELECT name
    FROM users
    WHERE id = $1
  `;
  const result = await db.query(checkUserQuery, [inp]);

  if (result.rows.length === 0) {
    console.error(`User not found for ID: ${inp}`);
    return null;
  }
  const name = result.rows[0].name;
  console.log(`Checked user. name: ${name}`); // it logs a name :)
  return name;
} //end of checkUser()

//the get route "/" for the default home page
//this gets reviews from the checkReviews function, and for each of them
//it proceeds to get the thumbnail from the Open Library API, if not already generated
//then outside of loop gets current username of the user browsing, then renders the page
//using thumbnails, and the result data (title, details, etc)
app.get('/', async (req, res) => {
const result = await checkReviews();
  for  (const review of result) {
    const title = review.title;
    const id = review.id;

    // check if whatever current item, and match it with reviews in database, see if it has link
    // if it does not have image link, then grab one from API and add it to column
    // after going through all books, then it will be done
    // if no image, make a special image show, a default one

    // review.id = id in table
    const checkThumbQuery = `
      SELECT thumb
      FROM reviews
      WHERE id = $1;
      `;

    const checkThumbResult = await db.query(checkThumbQuery, [id]);

    const currentThumb = checkThumbResult.rows[0]?.thumb;
    // then check if it has data in the thumb column
    if (!currentThumb) {
      let SEARCH_API_URL = process.env.SEARCH_API_URL;
      let COVER_ID_API_URL = process.env.COVER_ID_API_URL;
      let COVER_ISBN_API_URL = process.env.COVER_ISBN_API_URL;

      const searchTitle = title.replaceAll(' ', '+');
      SEARCH_API_URL = `${SEARCH_API_URL}${searchTitle}`.toLowerCase();

      const response = await axios.get(SEARCH_API_URL).catch(err => {
        console.log(err); return null;
      });

      if(!response || !response.data.docs || response.data.docs.length === 0) {
        console.log(`No data found for: ${title}`);
        continue;
      } 

      const bookData = response.data.docs[0];
      const cover_id = bookData?.cover_i;
      const isbn_data = bookData?.isbn[0];

      const COVER_API_URL = isbn_data
        ? COVER_ISBN_API_URL.replace('isbn_data', isbn_data)
        : COVER_ID_API_URL.replace('cover_id', cover_id);

      console.log(`Cover URL for ${title}: ${COVER_API_URL}`);

      // update thumb column in database
      const updateThumbQuery = `
        UPDATE reviews
        SET thumb = $1
        WHERE id = $2;
      `;
      await db.query(updateThumbQuery, [COVER_API_URL, id]);
    } else {
      console.log(`Thumb already exists for ${title}. Skipping API call.`);
    }

  }

  const usersName = await checkUser(currentUserId);

  res.render("index.ejs", {
    listUser: usersName,
    list: result,
    title: "Book Reviews",
  });
});
//the get route for the add page, when a user wants to create a review, they click the button,
//this route gets triggered, and the corresponding ejs with title is rendered
app.get('/add', async (req, res) => {
  res.render("modify.ejs", {
    title: "Write a Review"
  });
});

//the post route for the add page, after a user types in all required information, they submit it
//and this parses the data and queries it into the database. it also grabs the current date.
app.post('/add', async (req, res) => {
  try {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    let currentDate = `${month}/${day}/${year}`
    
    //breaks down parsed data for easy reference
    const { title, details, rating, book_auth } = req.body; 

    const addQuery = `
      INSERT INTO reviews (title, details, userid, rating, date, book_auth)
      VALUES ($1, $2, $3, $4, $5, $6)
    `
    await db.query(
      addQuery, [title, details, currentUserId, rating, currentDate, book_auth]
    );

    res.redirect('/');
  } catch (err) {
    console.log(err);
  }
});

//the get route for the edit page, after a user clicks the edit button on the review they desire to edit
//it grabs the id of the review they clicked on, then awaits query to get userid from review that has same id as reviewid
//and if the reviewid is equal to the current user id, then it will go forth, else it will redirect back home
app.get('/edit/:id', async (req, res) => {
  const { reviewId } = req.body;

  try {
    // if reviews.userid is equal to currentuser continue else say please only edit your own post
    const selectUserIdQuery = `
      SELECT userid
      FROM reviews
      WHERE id = $1
    `;
    let result = await db.query(selectUserIdQuery, [reviewId]);

    if (result === currentUserId) {
      const selectReviewWhereIdQuery = `
        SELECT *
        FROM reviews
        WHERE id = $1
      `;
      result = await db.query(selectReviewWhereIdQuery, [reviewId]);

      const review = result.rows[0];
      res.render('modify.ejs', {
        review: review,
        title: 'Edit Review'
      });
    } else {
      console.log('Hey! Dont edit someone elses message!');
      //req.session.flash = 'Hold up! You can\'t edit someone else\'s message, only your own. Please switch to the correct user.';
      res.redirect('/');
    }
  } catch (err) {
    console.error('Error fetching review:', err);
    res.status(500).send('Internal Server Error');
  }
});

//the post route for edit page, after user submits, it parses data, awaits database, and updates the reviews
//table using the data (title, details, etc), and sets the thumbnail to null, in case the title was changed
//TO FIX: only set thumb to NULL if the title is changed
app.post('/edit/:id', async (req, res) => {
  const reviewId = req.params.id;
  const { title, details, book_auth, rating } = req.body;

  try {
    // TO DO: only go through if post userid is equal to current userid
    const updateQuery = `
      UPDATE reviews
      SET title = $1, details = $2, book_auth = $3, thumb = NULL, rating = $4
      WHERE id = $5
    `;
    await db.query(updateQuery, [title, details, book_auth, rating, reviewId]);

    res.redirect('/');
  } catch (err) {
    console.error('Error updating reviews:', err);
    res.status(500).send('Internal Server Error');
  }
})

/*app.listen(port, () => {
  console.log(`App is running at http://localhost:${port}`);
});*/