import axios from "axios"
import { useEffect, useState } from "react"
import BlogFeed from "../../components/Home/BlogFeed"
import Header from "../../components/Home/Header"

const Home = () => {
    const [profile, setProfile] = useState({})
    
    const getGithubData = async () => {
        const github = 'https://api.github.com/users/subhibhat'
        const result = await axios.get(github)
        const { data } = result

        setProfile({
            name: data.name,
            login: data.login,
            photo: data.avatar_url,
            github: data.html_url,
            location: data.location
        })
    }

    useEffect(() => {
        getGithubData()
    }, [])

    const { photo, login } = profile

    return (
        <div className="container">
            <Header photo={photo} login={login} />
            {/* <BlogFeed /> */}
        </div>
    )
}

export default Home