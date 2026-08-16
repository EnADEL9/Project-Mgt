const protect = async(req, res, next) => {
    try {
        const auth = req.auth() // Clerk middleware returns req.auth as a function
        const userId = auth?.userId

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        return next()
    } catch (error) {
        console.log(error)
        return res.status(401).json({ message: error.code || error.message })
    }
}

export default protect