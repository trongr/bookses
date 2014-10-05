var configs = module.exports = {
    tmp: "tmp",
    static_public: "/static/public",
    static_public_dir: "static/public", // local path
    bucket: {
        user: "s3://bookses.user",
        img: "s3://bookses.img",
        book: "s3://bookses.book",
    },
    bucket_url: {
        user: "http://bookses.user.s3.amazonaws.com",
        img: "http://bookses.img.s3.amazonaws.com",
        book: "http://bookses.book.s3.amazonaws.com",
    },
    bin: {
        convert: "/usr/local/bin/convert",
        s3cmd: "/usr/local/bin/s3cmd",
    },
    db: "bookses",
    table: {
        likes: "likes",
        comments: "comments",
        books: "books",
        votes: "votes",
        voters: "voters",
        subs: "subs",
    },
    pagesize: 10,
    bigpagesize: 50,
}
