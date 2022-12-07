// import 'font-awesome/scss/font-awesome.scss'
import '@fortawesome/fontawesome-free/scss/fontawesome.scss'
import '@fortawesome/fontawesome-free/scss/brands.scss'

export const Icon = ({name, spin=false, className=''}) => {
    const classText = `fa-brands fa-${name} ${spin ? 'fa-spin' : ''} ${className ? className : ''}`
    return(<i className={classText.trim()} />)
}