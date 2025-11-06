import  React  from 'react';

const Loadable = (Component) => (props) =>
    (
        <React.Suspense fallback={<div>Loading...</div>}>
            <Component {...props} />
        </React.Suspense>
    );

export default Loadable;
