import React from 'react';
import { Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import './index.scss';
import {RightOutlined} from '@ant-design/icons';

const PageBreadcrumb = (props) => {
    const { breadCrumbList } = props;
    return (
        <Breadcrumb separator={<RightOutlined />}>
        {
            breadCrumbList && breadCrumbList.map((e) => (
                <Breadcrumb.Item key={e.name}>
                   { e.link ?  <Link to = {{
                        pathname: `${e.link}`,
                        state: e.param
                   }}>{e.name}</Link>: e.name }
                </Breadcrumb.Item>
            ))
        }
        </Breadcrumb>
    )
}

export default PageBreadcrumb;