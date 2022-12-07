import axios from "axios"
import { v4 as uuid } from "uuid"
import { useEffect, useState } from "react"
import { Icon } from "../Social/Icon"

const BlogFeed = () => {

    const [blogFeed, setBlogFeed] = useState([])

    const getMediumPost = async () => {
        const rss2json = `https://api.rss2json.com/v1/api.json`
        const blogFeed = `https://medium.com/feed/@subhibhat`
        const endpoint = `${rss2json}?rss_url=${blogFeed}`

        const feedData = await axios.get(endpoint)
        setBlogFeed(feedData.data.items)
    }

    useEffect(() => {
        getMediumPost()
    }, [])

    return (
        <section className="row justify-content-center my-3">
            <div className="col col-md-6">
                <h5 className="mb-3">
                    <strong>[ Blog ]</strong>
                </h5>
                <ul className="p-0 m-0 blog">
                    {blogFeed.map(item => {
                        const { title, link } = item
                        return (
                            <li key={uuid()}>
                                <Icon name="medium" />&nbsp;
                                <a href={link} rel="noreferrer" target={`_blank`}>
                                    {title}
                                </a>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </section>
    )
}

export default BlogFeed