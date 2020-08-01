import React from "react";
import "./utils";
import "./App.css";


class App extends React.Component 
{
	constructor(props) 
	{
		super(props);
		
		this.state = {
			
		};
	}
	
	componentDidMount() 
	{
	}
	
	onReceive(data_str)
	{
		console.log("Consuming: '", data_str, "'");
	}
	
	sendData(data)
	{
		console.log("Sending: '", data, "'");
		this.refs.socketclient.sendData(data);
	}
	
	render() 
	{
		return (
			<div>
				<WebSocketClient 
					initialIp="localhost"
					initialPort="8889"
					onReceiveData={(data)=>{this.onReceive(data)}}
					ref={'socketclient'}
				/>
			</div>
		);
	}
	
}

// see: https://reactjs.org/docs/error-boundaries.html
class AppWrapper extends React.Component 
{
	constructor(props) 
	{
		super(props);
		
		this.state = {
			errorMsg: null
		};
	}
	render() 
	{
		if(this.state.errorMsg != null)
		{
			return (<p className="error">{this.state.errorMsg}</p>);
		}
		else
		{
			return (<App />);
		}
	}
	
	static getDerivedStateFromError(error) 
	{
		// Update state so the next render will show the fallback UI.
		return { errorMsg: "The JS code encountered an internal error:".concat(error) };  
	}
	componentDidCatch(error, errorInfo) 
	{    
		// You can also log the error to an error reporting service
		console.error("App component caught error:", error, errorInfo);
	}
}

export default AppWrapper;
