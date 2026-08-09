import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='error-boundary-fallback'>
          <div className='error-boundary-content'>
            <h2>⚠️ 组件渲染出错</h2>
            <p className='error-boundary-message'>{this.state.error?.message || '发生了未知错误'}</p>
            <div className='error-boundary-actions'>
              <button className='primary' onClick={this.handleReset}>
                重试
              </button>
              <button className='ghost' onClick={() => window.location.reload()}>
                刷新页面
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
