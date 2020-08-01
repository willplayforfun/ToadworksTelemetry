import React from "react";
import WebSocketClient from "./WebSocketClient";
import "./App.css";

class App extends React.Component 
{
	constructor(props) 
	{
		super(props);
		
		this.state = {
			latestReceievedMessage: "",
			connectionStatus: false,
			debugSendText: "",
		};
	}
	
	componentDidMount() 
	{
	}
	
	onReceive(data_str)
	{
		console.log("Consuming: '", data_str, "'");
		this.setState({latestReceievedMessage: data_str});
	}
	
	sendData(data)
	{
		console.log("Sending: '", data, "'");
		this.refs.socketclient.sendData(data);
	}
	
	
	handleDebugFormChange(event) 
	{
		if(event.target.id === "debugSendText")
		{
			this.setState({debugSendText: event.target.value});
		}
	}
	handleDebugFormSubmit(event) 
	{
		event.preventDefault();
		this.sendData(this.state.debugSendText);
	}

	render() 
	{		
		var renderedApp;
		if(this.state.connectionStatus === true)
		{
			renderedApp = (
			<div>
				<form onSubmit={this.handleDebugFormSubmit.bind(this)}>
					<label>
						Send:&nbsp;<input type="text" id="debugSendText" value={this.state.debugSendText} onChange={this.handleDebugFormChange.bind(this)} />
					</label>
				</form>
				<button onClick={()=>{
					this.sendData(this.state.debugSendText);
				}}>
					Ping Server
				</button>
				<p>Latest received message:</p>
				<div className="code">{this.state.latestReceievedMessage}</div>
			</div>)
		}
		else
		{
			renderedApp = (<div>App is rendering.</div>);
		}
		
		return (
			<div>
				{renderedApp}
				<WebSocketClient 
					initialIp="localhost"
					initialPort="8889"
					onReceiveData={(data)=>{this.onReceive(data)}}
					onConnectionStatusChanged={(status)=>{
						this.setState({connectionStatus:status});
					}}
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
