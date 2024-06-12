use handlebars::Handlebars;
use html_editor::operation::*;
use html_editor::{parse, Element, Node};
use serde_json::Value;
use std::collections::BTreeMap;

#[derive(Clone, Copy)]
pub struct Template {
    pub name: &'static str,
    pub body: &'static str,
}

pub fn run_hbht(html: &str, templates: Vec<Template>) -> String {
    let mut fragment = parse(html).unwrap();
    process_component_nodes(&mut fragment, &templates);

    fragment.html()
}

fn process_component_nodes(fragment: &mut Vec<Node>, templates: &Vec<Template>) {
    for template in templates {
        fn visit(nodes: &mut Vec<Node>, comp: Template, ts: &Vec<Template>) {
            let Template { name, body } = comp;
            let selector = Selector::from(name);
            for node in nodes.iter_mut() {
                if let Node::Element(ref mut el) = node {
                    if selector.matches(el) {
                        let mut nodes = process_template(el, body); // run handlebars here
                        process_component_nodes(&mut nodes, ts);
                        if nodes.len() == 1 {
                            let new_node = nodes[0].clone();
                            *node = new_node;
                        } else {
                            let new_node = Node::Element(Element {
                                name: String::from("div"),
                                attrs: vec![],
                                children: nodes,
                            });
                            *node = new_node;
                        }
                    } else {
                        visit(&mut el.children, comp, ts);
                        // el.replace_with(selector, f);
                    }
                }
            }
        }
        visit(fragment, *template, templates);
        //}
    }
}

fn process_template(elem: &Element, hb_body: &str) -> Vec<Node> {
    let handlebars = Handlebars::new();
    //handlebars.register_template_string(name, hb_body).unwrap();

    let mut data = BTreeMap::new();
    for (k, v) in elem.attrs.iter() {
        data.insert(k, serde_json::Value::String(v.clone()));
    }
    let body_nm = "innerHTML".to_string();
    let body_str = elem.children.html();
    data.insert(&body_nm, serde_json::Value::String(body_str));

    let child_tags = elem
        .children
        .iter()
        .map(|c| {
            if let Node::Element(el) = c {
                Some(&(el.name))
            } else {
                None
            }
        })
        .flatten();

    for nm in child_tags {
        let json_vec = elem
            .children
            .iter()
            .filter(|node| {
                if let Node::Element(el) = node {
                    *nm == el.name
                } else {
                    false
                }
            })
            .map(|node| {
                if let Node::Element(el) = node {
                    Some(attrs_to_obj(el.attrs.clone()))
                } else {
                    None
                }
            })
            .flatten()
            .collect();

        data.insert(nm, serde_json::Value::Array(json_vec));
    }
    let result = handlebars.render_template(hb_body, &data).unwrap();
    return parse(&result).unwrap();
}

fn attrs_to_obj(attrs: Vec<(String, String)>) -> Value {
    Value::Object(
        attrs
            .into_iter()
            .map(|(k, v)| (k, serde_json::Value::String(v)))
            .collect(),
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let ts = vec![Template {
            name: "headline",
            body: "<h1 id=\"{{id}}\">{{text}}</h1>",
        }];
        let result = run_hbht(
            "<headline id=\"myId\" text=\"Hello World!\"></headline>",
            ts,
        );
        assert_eq!(result, "<h1 id=\"myId\">Hello World!</h1>");
    }

    #[test]
    fn inner_html() {
        let ts = vec![Template {
            name: "card",
            body: "<div class=\"card\">{{{innerHTML}}}</div>",
        }];
        let result = run_hbht("<card><h1>Hello World!</h1></card>", ts);
        assert_eq!(result, "<div class=\"card\"><h1>Hello World!</h1></div>");
    }
}
