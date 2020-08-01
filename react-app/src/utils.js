export var format = function() 
{
	var a = arguments[0];
	for (var k in arguments) {
		if(k === 0)
		{
			continue;
		}
		else
		{
			a = a.replace("{" + (k - 1) + "}", arguments[k]);
		}
	}
	return a;
}

export var onlyWhitespace = function (a)
{
	return /\S/.test(a);
}

//export default {onlyWhitespace, format};
