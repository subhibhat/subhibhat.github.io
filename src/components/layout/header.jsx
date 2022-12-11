import SocialBar from "../social"
import resumePdf from '../../assets/resume.pdf'

const Header = ({photo, login}) => {
    return (
        <header className="text-light mt-5">
            <div className="row justify-content-center my-4">
                <div className="col col-md-6 text-center">
                    <img src={photo} alt={login} className="rounded profile" />
                    <div className="my-4">
                        <p className="m-0" style={{textTransform: 'capitalize'}}>
                            <strong>Subhibhat Srikham</strong>
                        </p>
                        <p><small>Si Sa Ket, Thailand</small></p>
                    </div>
                    <SocialBar />
                    <div className="mt-2">
                        <a href={resumePdf} rel="noreferrer noopener" target='_blank' className="btn btn-sm btn-outline-light">view my resume</a>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Header